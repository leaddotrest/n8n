import {
	INodeProperties,
} from 'n8n-workflow';

export const linkedResourceOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
			},
			{
				name: 'Delete',
				value: 'delete',
			},
			{
				name: 'Get',
				value: 'get',
			},
			{
				name: 'Get All',
				value: 'getAll',
			},
			{
				name: 'Update',
				value: 'update',
			},
		],
		default: 'get',
		description: 'The operation to perform.',
	},
] as INodeProperties[];

export const linkedResourceFields = [
/* -------------------------------------------------------------------------- */
/*                       linkedResource:ALL                                   */
/* -------------------------------------------------------------------------- */
{
	displayName: 'Task List ID',
	name: 'taskListId',
	type: 'string',
	displayOptions: {
		show: {
			operation: [
				'create',
				'delete',
				'get',
				'getAll',
				'update',
			],
			resource: [
				'linkedResource',
			],
		},
	},
	required: true,
	default: '',
},
{
	displayName: 'Task ID',
	name: 'taskId',
	type: 'string',
	displayOptions: {
		show: {
			operation: [
				'create',
				'delete',
				'get',
				'getAll',
				'update',
			],
			resource: [
				'linkedResource',
			],
		},
	},
	required: true,
	default: '',
},
/* -------------------------------------------------------------------------- */
/*                           linkedResource:create                            */
/* -------------------------------------------------------------------------- */
	{
		displayName: 'Application Name',
		name: 'applicationName',
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'create',
				],
				resource: [
					'linkedResource',
				],
			},
		},
		required: true,
		default: '',
		description: 'Field indicating app name of the source that is sending the linked entity.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'create',
				],
			},
		},
		options: [
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				default: '',
				description: 'Field indicating title of the linked entity.',
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'ID of the object that is associated with this task on the third-party/partner system.',
			},
			{
				displayName: 'Web URL',
				name: 'webUrl',
				type: 'string',
				default: '',
				description: 'Deeplink to the linked entity.',
			},
		],
	},
/* -------------------------------------------------------------------------- */
/*                           linkedResource:get/delete/update                 */
/* -------------------------------------------------------------------------- */
	{
		displayName: 'Linked Resource ID',
		name: 'linkedResourceId',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'delete',
					'get',
					'update',
				],
			},
		},
		default: '',
		required: true,
	},
/* -------------------------------------------------------------------------- */
/*                           linkedResource:getAll                            */
/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'getAll',
				],
			},
		},
		default: false,
		description: 'If all results should be returned or only up to a given limit.',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'getAll',
				],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'How many results to return.',
	},
/* -------------------------------------------------------------------------- */
/*                           linkedResource:update                            */
/* -------------------------------------------------------------------------- */
	{
		displayName: 'Application Name',
		name: 'applicationName',
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'update',
				],
				resource: [
					'linkedResource',
				],
			},
		},
		required: true,
		default: '',
		description: 'Field indicating app name of the source that is sending the linked entity.',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'linkedResource',
				],
				operation: [
					'update',
				],
			},
		},
		options: [
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				default: '',
				description: 'Field indicating title of the linked entity.',
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'ID of the object that is associated with this task on the third-party/partner system.',
			},
			{
				displayName: 'Web URL',
				name: 'webUrl',
				type: 'string',
				default: '',
				description: 'Deeplink to the linked entity.',
			},
		],
	},
] as INodeProperties[];
