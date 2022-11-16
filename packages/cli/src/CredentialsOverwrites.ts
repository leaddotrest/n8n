/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-underscore-dangle */
import { deepCopy, ICredentialDataDecryptedObject } from 'n8n-workflow';
import { CredentialTypes } from '@/CredentialTypes';
import type { ICredentialsOverwrite } from '@/Interfaces';
import * as GenericHelpers from '@/GenericHelpers';

class CredentialsOverwritesClass {
	private credentialTypes = CredentialTypes();

	private overwriteData: ICredentialsOverwrite = {};

	private resolvedTypes: string[] = [];

	async init(overwriteData?: ICredentialsOverwrite) {
		// If data gets reinitialized reset the resolved types cache
		this.resolvedTypes.length = 0;

		if (overwriteData !== undefined) {
			// If data is already given it can directly be set instead of
			// loaded from environment
			this.setData(deepCopy(overwriteData));
			return;
		}

		const data = (await GenericHelpers.getConfigValue('credentials.overwrite.data')) as string;

		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-shadow
			const overwriteData = JSON.parse(data);
			this.setData(overwriteData);
		} catch (error) {
			throw new Error(`The credentials-overwrite is not valid JSON.`);
		}
	}

	private setData(overwriteData: ICredentialsOverwrite) {
		this.overwriteData = overwriteData;

		for (const type in overwriteData) {
			const overwrites = this.getOverwrites(type);

			if (overwrites && Object.keys(overwrites).length) {
				this.overwriteData[type] = overwrites;
			}
		}
	}

	applyOverwrite(type: string, data: ICredentialDataDecryptedObject) {
		const overwrites = this.get(type);

		if (overwrites === undefined) {
			return data;
		}

		const returnData = deepCopy(data);
		// Overwrite only if there is currently no data set
		for (const key of Object.keys(overwrites)) {
			// @ts-ignore
			if ([null, undefined, ''].includes(returnData[key])) {
				returnData[key] = overwrites[key];
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return returnData;
	}

	private getOverwrites(type: string): ICredentialDataDecryptedObject | undefined {
		if (this.resolvedTypes.includes(type)) {
			// Type got already resolved and can so returned directly
			return this.overwriteData[type];
		}

		const credentialTypeData = this.credentialTypes.getByName(type);

		if (credentialTypeData.extends === undefined) {
			this.resolvedTypes.push(type);
			return this.overwriteData[type];
		}

		const overwrites: ICredentialDataDecryptedObject = {};
		// eslint-disable-next-line no-restricted-syntax
		for (const credentialsTypeName of credentialTypeData.extends) {
			Object.assign(overwrites, this.getOverwrites(credentialsTypeName));
		}

		if (this.overwriteData[type] !== undefined) {
			Object.assign(overwrites, this.overwriteData[type]);
		}

		this.resolvedTypes.push(type);

		return overwrites;
	}

	get(type: string): ICredentialDataDecryptedObject | undefined {
		return this.overwriteData[type];
	}

	getAll(): ICredentialsOverwrite {
		return this.overwriteData;
	}
}

let credentialsOverwritesInstance: CredentialsOverwritesClass | undefined;

// eslint-disable-next-line @typescript-eslint/naming-convention
export function CredentialsOverwrites(): CredentialsOverwritesClass {
	if (credentialsOverwritesInstance === undefined) {
		credentialsOverwritesInstance = new CredentialsOverwritesClass();
	}

	return credentialsOverwritesInstance;
}
