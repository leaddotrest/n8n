import {
	type IDataObject,
	type INodeExecutionData,
	type INodeProperties,
	type IExecuteFunctions,
	IRequestOptions,
} from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

export const properties: INodeProperties[] = [
	{
		displayName: 'Source Library Name or ID',
		name: 'repo',
		type: 'options',
		placeholder: 'Select a Library',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getRepos',
		},
		default: '',
		description:
			'The name of SeaTable library to access. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
	},
	{
		// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
		displayName: 'File Path',
		name: 'file_path',
		type: 'options',
		placeholder: '/invoices/2024/invoice.pdf',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getFilesInRepo',
			loadOptionsDependsOn: ['repo'],
		},
		default: '',
		// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-options
		description:
			'Provide the file name with complete path. Choose from the list, or specify the complete path using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
	},
];

const displayOptions = {
	show: {
		resource: ['tags'],
		operation: ['list_tags'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('seafileApi');
	const baseURL = credentials?.domain;

	// get parameters
	const repo = this.getNodeParameter('repo', index) as string;
	const file_path = this.getNodeParameter('file_path', index) as string;

	const options: IRequestOptions = {
		method: 'GET',
		qs: {
			repo_id: repo,
			file_path: file_path,
		},
		body: {},
		uri: `${baseURL}/api/v2.1/repos/${repo}/file-tags/` as string,
		json: true,
	};

	const responseData = await this.helpers.requestWithAuthentication.call(
		this,
		'seafileApi',
		options,
	);

	if (responseData.file_tags) {
		return this.helpers.returnJsonArray(responseData.file_tags as IDataObject[]);
	}
	return [];
}
