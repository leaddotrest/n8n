import type { INodeProperties } from 'n8n-workflow';
import { baseRLC, tableRLC } from '../common.descriptions';

import * as create from './create.operation';
import * as deleteRecord from './deleteRecord.operation';
import * as get from './get.operation';
import * as search from './search.operation';
import * as update from './update.operation';
import * as upsert from './upsert.operation';

export { create, deleteRecord, get, search, update, upsert };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new record in a table',
				action: 'Create a new record in a table',
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-option-name-wrong-for-upsert
				name: 'Create Or Update',
				value: 'upsert',
				description: 'Create a new record, or update the current one if it already exists (upsert)',
				action: 'Create a new record, or update the current one if it already exists (upsert)',
			},
			{
				name: 'Delete',
				value: 'deleteRecord',
				description: 'Delete a record from a table',
				action: 'Delete a record from a table',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a record from a table',
				action: 'Retrieve a record from a table',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Search for specific records or list all',
				action: 'Search for specific records or list all',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a record in a table',
				action: 'Update a record in a table',
			},
		],
		default: 'read',
		displayOptions: {
			show: {
				resource: ['record'],
			},
		},
	},
	baseRLC,
	tableRLC,
	...create.description,
	...deleteRecord.description,
	...get.description,
	...search.description,
	...update.description,
	...upsert.description,
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				operation: ['create', 'deleteRecord', 'update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Bulk Size',
				name: 'bulkSize',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
				default: 10,
				description: 'Number of records to process at once',
			},
			{
				displayName: 'Ignore Fields',
				name: 'ignoreFields',
				type: 'string',
				requiresDataPath: 'multiple',
				displayOptions: {
					show: {
						'/operation': ['update'],
						'/updateAllFields': [true],
					},
				},
				default: '',
				description: 'Comma-separated list of fields to ignore',
			},
			{
				displayName: 'Typecast',
				name: 'typecast',
				type: 'boolean',
				displayOptions: {
					show: {
						'/operation': ['append', 'update'],
					},
				},
				default: false,
				description:
					'Whether the Airtable API should attempt mapping of string values for linked records & select options',
			},
		],
	},
];
