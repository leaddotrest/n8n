import nock from 'nock';

import * as create from '../../../../v2/actions/record/create.operation';

import * as transport from '../../../../v2/transport';
import { createMockExecuteFunction } from '../helpers';

jest.mock('../../../../v2/transport', () => {
	const originalModule = jest.requireActual('../../../../v2/transport');
	return {
		...originalModule,
		apiRequest: jest.fn(async function () {
			return {};
		}),
	};
});

describe('Test AirtableV2, create operation', () => {
	beforeAll(() => {
		nock.disableNetConnect();
	});

	afterAll(() => {
		nock.restore();
		jest.unmock('../../../../v2/transport');
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should create a record, autoMapInputData', async () => {
		const nodeParameters = {
			operation: 'create',
			dataMode: 'autoMapInputData',
			options: {
				typecast: true,
				ignoreFields: 'spam',
			},
		};

		const items = [
			{
				json: {
					foo: 'foo 1',
					spam: 'eggs',
					bar: 'bar 1',
				},
			},
			{
				json: {
					foo: 'foo 2',
					spam: 'eggs',
					bar: 'bar 2',
				},
			},
		];

		await create.execute.call(
			createMockExecuteFunction(nodeParameters),
			items,
			'appYoLbase',
			'tblltable',
		);

		expect(transport.apiRequest).toHaveBeenCalledTimes(2);
		expect(transport.apiRequest).toHaveBeenCalledWith('POST', 'appYoLbase/tblltable', {
			fields: {
				foo: 'foo 1',
				bar: 'bar 1',
			},
			typecast: true,
		});
		expect(transport.apiRequest).toHaveBeenCalledWith('POST', 'appYoLbase/tblltable', {
			fields: {
				foo: 'foo 2',
				bar: 'bar 2',
			},
			typecast: true,
		});
	});

	it('should create a record, defineBelow', async () => {
		const nodeParameters = {
			operation: 'create',
			dataMode: 'defineBelow',
			valuesToSend: {
				values: [
					{
						column: 'foo',
						value: 'foo 1',
					},
					{
						column: 'bar',
						value: 'bar 1',
					},
				],
			},
			options: {},
		};

		const items = [
			{
				json: {},
			},
		];

		await create.execute.call(
			createMockExecuteFunction(nodeParameters),
			items,
			'appYoLbase',
			'tblltable',
		);

		expect(transport.apiRequest).toHaveBeenCalledTimes(1);
		expect(transport.apiRequest).toHaveBeenCalledWith('POST', 'appYoLbase/tblltable', {
			fields: {
				foo: 'foo 1',
				bar: 'bar 1',
			},
			typecast: false,
		});
	});
});
