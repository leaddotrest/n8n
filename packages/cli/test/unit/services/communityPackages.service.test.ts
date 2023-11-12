import { exec } from 'child_process';
import { access as fsAccess, mkdir as fsMkdir } from 'fs/promises';
import axios from 'axios';
import { mocked } from 'jest-mock';
import Container from 'typedi';
import type { PublicInstalledPackage } from 'n8n-workflow';

import {
	NODE_PACKAGE_PREFIX,
	NPM_COMMAND_TOKENS,
	NPM_PACKAGE_STATUS_GOOD,
	RESPONSE_ERROR_MESSAGES,
} from '@/constants';
import config from '@/config';
import { InstalledPackages } from '@db/entities/InstalledPackages';
import type { CommunityPackages } from '@/Interfaces';
import { CommunityPackagesService } from '@/services/communityPackages.service';
import { InstalledNodesRepository } from '@db/repositories/installedNodes.repository';
import { InstalledPackagesRepository } from '@db/repositories/installedPackages.repository';
import { InstalledNodes } from '@db/entities/InstalledNodes';
import { LoadNodesAndCredentials } from '@/LoadNodesAndCredentials';

import { mockInstance } from '../../shared/mocking';
import {
	COMMUNITY_NODE_VERSION,
	COMMUNITY_PACKAGE_VERSION,
} from '../../integration/shared/constants';
import { randomName } from '../../integration/shared/random';
import { mockPackageName, mockPackagePair } from '../../integration/shared/utils';

jest.mock('fs/promises');
jest.mock('child_process');
jest.mock('axios');

type ExecOptions = NonNullable<Parameters<typeof exec>[1]>;
type ExecCallback = NonNullable<Parameters<typeof exec>[2]>;

const execMock = ((...args) => {
	const cb = args[args.length - 1] as ExecCallback;
	cb(null, 'Done', '');
}) as typeof exec;

describe('CommunityPackagesService', () => {
	const installedNodesRepository = mockInstance(InstalledNodesRepository);
	installedNodesRepository.create.mockImplementation(() => {
		const nodeName = randomName();

		return Object.assign(new InstalledNodes(), {
			name: nodeName,
			type: nodeName,
			latestVersion: COMMUNITY_NODE_VERSION.CURRENT.toString(),
			packageName: 'test',
		});
	});

	const installedPackageRepository = mockInstance(InstalledPackagesRepository);
	installedPackageRepository.create.mockImplementation(() => {
		return Object.assign(new InstalledPackages(), {
			packageName: mockPackageName(),
			installedVersion: COMMUNITY_PACKAGE_VERSION.CURRENT,
		});
	});

	mockInstance(LoadNodesAndCredentials);

	const communityPackagesService = Container.get(CommunityPackagesService);

	beforeEach(() => {
		config.load(config.default);
	});

	describe('parseNpmPackageName()', () => {
		test('should fail with empty package name', () => {
			expect(() => communityPackagesService.parseNpmPackageName('')).toThrowError();
		});

		test('should fail with invalid package prefix name', () => {
			expect(() =>
				communityPackagesService.parseNpmPackageName('INVALID_PREFIX@123'),
			).toThrowError();
		});

		test('should parse valid package name', () => {
			const name = mockPackageName();
			const parsed = communityPackagesService.parseNpmPackageName(name);

			expect(parsed.rawString).toBe(name);
			expect(parsed.packageName).toBe(name);
			expect(parsed.scope).toBeUndefined();
			expect(parsed.version).toBeUndefined();
		});

		test('should parse valid package name and version', () => {
			const name = mockPackageName();
			const version = '0.1.1';
			const fullPackageName = `${name}@${version}`;
			const parsed = communityPackagesService.parseNpmPackageName(fullPackageName);

			expect(parsed.rawString).toBe(fullPackageName);
			expect(parsed.packageName).toBe(name);
			expect(parsed.scope).toBeUndefined();
			expect(parsed.version).toBe(version);
		});

		test('should parse valid package name, scope and version', () => {
			const scope = '@n8n';
			const name = mockPackageName();
			const version = '0.1.1';
			const fullPackageName = `${scope}/${name}@${version}`;
			const parsed = communityPackagesService.parseNpmPackageName(fullPackageName);

			expect(parsed.rawString).toBe(fullPackageName);
			expect(parsed.packageName).toBe(`${scope}/${name}`);
			expect(parsed.scope).toBe(scope);
			expect(parsed.version).toBe(version);
		});
	});

	describe('executeCommand()', () => {
		beforeEach(() => {
			mocked(fsAccess).mockReset();
			mocked(fsMkdir).mockReset();
			mocked(exec).mockReset();
		});

		test('should call command with valid options', async () => {
			const execMock = ((...args) => {
				const arg = args[1] as ExecOptions;
				expect(arg.cwd).toBeDefined();
				expect(arg.env).toBeDefined();
				// PATH or NODE_PATH may be undefined depending on environment so we don't check for these keys.
				const cb = args[args.length - 1] as ExecCallback;
				cb(null, 'Done', '');
			}) as typeof exec;

			mocked(exec).mockImplementation(execMock);

			await communityPackagesService.executeNpmCommand('ls');

			expect(fsAccess).toHaveBeenCalled();
			expect(exec).toHaveBeenCalled();
			expect(fsMkdir).toBeCalledTimes(0);
		});

		test('should make sure folder exists', async () => {
			mocked(exec).mockImplementation(execMock);

			await communityPackagesService.executeNpmCommand('ls');
			expect(fsAccess).toHaveBeenCalled();
			expect(exec).toHaveBeenCalled();
			expect(fsMkdir).toBeCalledTimes(0);
		});

		test('should try to create folder if it does not exist', async () => {
			mocked(exec).mockImplementation(execMock);
			mocked(fsAccess).mockImplementation(() => {
				throw new Error('Folder does not exist.');
			});

			await communityPackagesService.executeNpmCommand('ls');

			expect(fsAccess).toHaveBeenCalled();
			expect(exec).toHaveBeenCalled();
			expect(fsMkdir).toHaveBeenCalled();
		});

		test('should throw especial error when package is not found', async () => {
			const erroringExecMock = ((...args) => {
				const cb = args[args.length - 1] as ExecCallback;
				const msg = `Something went wrong - ${NPM_COMMAND_TOKENS.NPM_PACKAGE_NOT_FOUND_ERROR}. Aborting.`;
				cb(new Error(msg), '', '');
			}) as typeof exec;

			mocked(exec).mockImplementation(erroringExecMock);

			const call = async () => communityPackagesService.executeNpmCommand('ls');

			await expect(call).rejects.toThrowError(RESPONSE_ERROR_MESSAGES.PACKAGE_NOT_FOUND);

			expect(fsAccess).toHaveBeenCalled();
			expect(exec).toHaveBeenCalled();
			expect(fsMkdir).toHaveBeenCalledTimes(0);
		});
	});

	describe('crossInformationPackage()', () => {
		test('should return same list if availableUpdates is undefined', () => {
			const fakePkgs = mockPackagePair();

			const crossedPkgs = communityPackagesService.matchPackagesWithUpdates(fakePkgs);

			expect(crossedPkgs).toEqual(fakePkgs);
		});

		test('should correctly match update versions for packages', () => {
			const [pkgA, pkgB] = mockPackagePair();

			const updates: CommunityPackages.AvailableUpdates = {
				[pkgA.packageName]: {
					current: pkgA.installedVersion,
					wanted: pkgA.installedVersion,
					latest: '0.2.0',
					location: pkgA.packageName,
				},
				[pkgB.packageName]: {
					current: pkgA.installedVersion,
					wanted: pkgA.installedVersion,
					latest: '0.3.0',
					location: pkgA.packageName,
				},
			};

			const [crossedPkgA, crossedPkgB]: PublicInstalledPackage[] =
				communityPackagesService.matchPackagesWithUpdates([pkgA, pkgB], updates);

			expect(crossedPkgA.updateAvailable).toBe('0.2.0');
			expect(crossedPkgB.updateAvailable).toBe('0.3.0');
		});

		test('should correctly match update versions for single package', () => {
			const [pkgA, pkgB] = mockPackagePair();

			const updates: CommunityPackages.AvailableUpdates = {
				[pkgB.packageName]: {
					current: pkgA.installedVersion,
					wanted: pkgA.installedVersion,
					latest: '0.3.0',
					location: pkgA.packageName,
				},
			};

			const [crossedPkgA, crossedPkgB]: PublicInstalledPackage[] =
				communityPackagesService.matchPackagesWithUpdates([pkgA, pkgB], updates);

			expect(crossedPkgA.updateAvailable).toBeUndefined();
			expect(crossedPkgB.updateAvailable).toBe('0.3.0');
		});
	});

	describe('matchMissingPackages()', () => {
		test('should not match failed packages that do not exist', () => {
			const fakePkgs = mockPackagePair();
			setMissingPackages([
				`${NODE_PACKAGE_PREFIX}very-long-name-that-should-never-be-generated@1.0.0`,
				`${NODE_PACKAGE_PREFIX}another-very-long-name-that-never-is-seen`,
			]);

			const matchedPackages = communityPackagesService.matchMissingPackages(fakePkgs);

			expect(matchedPackages).toEqual(fakePkgs);

			const [first, second] = matchedPackages;

			expect(first.failedLoading).toBeUndefined();
			expect(second.failedLoading).toBeUndefined();
		});

		test('should match failed packages that should be present', () => {
			const [pkgA, pkgB] = mockPackagePair();
			setMissingPackages([
				`${NODE_PACKAGE_PREFIX}very-long-name-that-should-never-be-generated@1.0.0`,
				`${pkgA.packageName}@${pkgA.installedVersion}`,
			]);

			const [matchedPkgA, matchedPkgB] = communityPackagesService.matchMissingPackages([
				pkgA,
				pkgB,
			]);

			expect(matchedPkgA.failedLoading).toBe(true);
			expect(matchedPkgB.failedLoading).toBeUndefined();
		});

		test('should match failed packages even if version is wrong', () => {
			const [pkgA, pkgB] = mockPackagePair();
			setMissingPackages([
				`${NODE_PACKAGE_PREFIX}very-long-name-that-should-never-be-generated@1.0.0`,
				`${pkgA.packageName}@123.456.789`,
			]);
			const [matchedPkgA, matchedPkgB] = communityPackagesService.matchMissingPackages([
				pkgA,
				pkgB,
			]);

			expect(matchedPkgA.failedLoading).toBe(true);
			expect(matchedPkgB.failedLoading).toBeUndefined();
		});
	});

	describe('checkNpmPackageStatus()', () => {
		test('should call axios.post', async () => {
			await communityPackagesService.checkNpmPackageStatus(mockPackageName());

			expect(axios.post).toHaveBeenCalled();
		});

		test('should not fail if request fails', async () => {
			mocked(axios.post).mockImplementation(() => {
				throw new Error('Something went wrong');
			});

			const result = await communityPackagesService.checkNpmPackageStatus(mockPackageName());

			expect(result.status).toBe(NPM_PACKAGE_STATUS_GOOD);
		});

		test('should warn if package is banned', async () => {
			mocked(axios.post).mockResolvedValue({ data: { status: 'Banned', reason: 'Not good' } });

			const result = (await communityPackagesService.checkNpmPackageStatus(
				mockPackageName(),
			)) as CommunityPackages.PackageStatusCheck;

			expect(result.status).toBe('Banned');
			expect(result.reason).toBe('Not good');
		});
	});

	describe('hasPackageLoadedSuccessfully()', () => {
		test('should return true when failed package list does not exist', () => {
			setMissingPackages([]);
			expect(communityPackagesService.hasPackageLoaded('package')).toBe(true);
		});

		test('should return true when package is not in the list of missing packages', () => {
			setMissingPackages(['packageA@0.1.0', 'packageB@0.1.0']);
			expect(communityPackagesService.hasPackageLoaded('packageC')).toBe(true);
		});

		test('should return false when package is in the list of missing packages', () => {
			setMissingPackages(['packageA@0.1.0', 'packageB@0.1.0']);
			expect(communityPackagesService.hasPackageLoaded('packageA')).toBe(false);
		});
	});

	describe('removePackageFromMissingList()', () => {
		test('should do nothing if key does not exist', () => {
			setMissingPackages([]);
			communityPackagesService.removePackageFromMissingList('packageA');

			expect(communityPackagesService.missingPackages).toBeEmptyArray();
		});

		test('should remove only correct package from list', () => {
			setMissingPackages(['packageA@0.1.0', 'packageB@0.2.0', 'packageC@0.2.0']);

			communityPackagesService.removePackageFromMissingList('packageB');

			expect(communityPackagesService.missingPackages).toEqual([
				'packageA@0.1.0',
				'packageC@0.2.0',
			]);
		});

		test('should not remove if package is not in the list', () => {
			const failedToLoadList = ['packageA@0.1.0', 'packageB@0.2.0', 'packageB@0.2.0'];
			setMissingPackages(failedToLoadList);
			communityPackagesService.removePackageFromMissingList('packageC');

			expect(communityPackagesService.missingPackages).toEqual(failedToLoadList);
		});
	});

	const setMissingPackages = (missingPackages: string[]) => {
		Object.assign(communityPackagesService, { missingPackages });
	};
});
