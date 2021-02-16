import {
	INodeProperties,
} from 'n8n-workflow';

export const channelMessageOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'channelMessage',
				],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a message',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all messages',
			},
			{
				name: 'Reply To',
				value: 'replyTo',
				description: 'Reply to a message thread',
			},
		],
		default: 'create',
		description: 'The operation to perform.',
	},
] as INodeProperties[];

export const channelMessageFields = [

	/* -------------------------------------------------------------------------- */
	/*                                 channelMessage:create                      */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Team ID',
		name: 'teamId',
		required: true,
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTeams',
		},
		displayOptions: {
			show: {
				operation: [
					'create',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'Team ID',
	},
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getChannels',
			loadOptionsDependsOn: [
				'teamId',
			],
		},
		displayOptions: {
			show: {
				operation: [
					'create',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'Channel ID',
	},
	{
		displayName: 'Message Type',
		name: 'messageType',
		required: true,
		type: 'options',
		options: [
			{
				name: 'Text',
				value: 'text',
			},
			{
				name: 'HTML',
				value: 'html',
			},
		],
		displayOptions: {
			show: {
				operation: [
					'create',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'The type of the content',
	},
	{
		displayName: 'Message',
		name: 'message',
		required: true,
		type: 'string',
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				operation: [
					'create',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'The content of the item.',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 channelMessage:getAll                      */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Team ID',
		name: 'teamId',
		required: true,
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTeams',
		},
		displayOptions: {
			show: {
				operation: [
					'getAll',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'Team ID',
	},
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getChannels',
			loadOptionsDependsOn: [
				'teamId',
			],
		},
		displayOptions: {
			show: {
				operation: [
					'getAll',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'Channel ID',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: [
					'getAll',
				],
				resource: [
					'channelMessage',
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
				operation: [
					'getAll',
				],
				resource: [
					'channelMessage',
				],
				returnAll: [
					false,
				],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 500,
		},
		default: 100,
		description: 'How many results to return.',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 channelMessage:replyTo                      */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Team ID',
		name: 'teamId',
		required: true,
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTeams',
		},
		displayOptions: {
			show: {
				operation: [
					'replyTo',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'Team ID',
	},
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getChannels',
			loadOptionsDependsOn: [
				'teamId',
			],
		},
		displayOptions: {
			show: {
				operation: [
					'replyTo',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'Channel ID',
	},
	{
		displayName: 'Reply To ID',
		name: 'replyToId',
		required: true,
		type: 'string',
		typeOptions: {
			alwaysOpenEditWindow: false,
		},
		displayOptions: {
			show: {
				operation: [
					'replyTo',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'The ID of the message you want to reply to.',
	},
	{
		displayName: 'Message Type',
		name: 'messageType',
		required: true,
		type: 'options',
		options: [
			{
				name: 'Text',
				value: 'text',
			},
			{
				name: 'HTML',
				value: 'html',
			},
		],
		displayOptions: {
			show: {
				operation: [
					'replyTo',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'The type of the content',
	},
	{
		displayName: 'Message',
		name: 'message',
		required: true,
		type: 'string',
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				operation: [
					'replyTo',
				],
				resource: [
					'channelMessage',
				],
			},
		},
		default: '',
		description: 'The content of the item.',
	},
] as INodeProperties[];
