import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import {
	OptionsWithUri,
} from 'request';

import {
	IBinaryKeyData,
	IDataObject,
	INodeExecutionData,
	IPollFunctions,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';


interface IAttachment {
	url: string;
	title: string;
	mimetype: string;
	size: number;
}

/**
 * Make an API request to NocoDB
 *
 * @param {IHookFunctions} this
 * @param {string} method
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
export async function apiRequest(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions, method: string, endpoint: string, body: object, query?: IDataObject, uri?: string, option: IDataObject = {}): Promise<any> { // tslint:disable-line:no-any
	const credentials = this.getCredentials('nocoDb');

	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}

	query = query || {};

	const options: OptionsWithUri = {
		headers: {
			'xc-auth': credentials.apiToken,
		},
		method,
		body,
		qs: query,
		uri: uri || `${credentials.host}${endpoint}`,
		useQuerystring: false,
		json: true,

	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}


/**
 * Make an API request to paginated NocoDB endpoint
 * and return all results
 *
 * @export
 * @param {(IHookFunctions | IExecuteFunctions)} this
 * @param {string} method
 * @param {string} endpoint
 * @param {IDataObject} body
 * @param {IDataObject} [query]
 * @returns {Promise<any>}
 */
export async function apiRequestAllItems(this: IHookFunctions | IExecuteFunctions | IPollFunctions, method: string, endpoint: string, body: IDataObject, query?: IDataObject): Promise<any> { // tslint:disable-line:no-any

	if (query === undefined) {
		query = {};
	}
	query.limit = 100;
	query.offset = 0;
	const returnData: IDataObject[] = [];

	let responseData;

	do {
		responseData = await apiRequest.call(this, method, endpoint, body, query);

		returnData.push(...responseData);

		query.offset += query.limit;

	} while (
		responseData.length === 0
	);

	return returnData;
}

export async function downloadRecordAttachments(this: IExecuteFunctions | IPollFunctions, records: IDataObject[], fieldNames: string[]): Promise<INodeExecutionData[]> {
	const elements: INodeExecutionData[] = [];

	for (const record of records) {
		const element: INodeExecutionData = { json: {}, binary: {} };
		element.json = record as unknown as IDataObject;
		for (const fieldName of fieldNames) {
			if (record[fieldName]) {
				for (const [index, attachment] of (JSON.parse(record[fieldName] as string) as IAttachment[]).entries()) {
					const file = await apiRequest.call(this, 'GET', '', {}, {}, attachment.url, { json: false, encoding: null });
					element.binary![`${fieldName}_#${record.id}_${index}`] = {
						data: Buffer.from(file).toString('base64'),
						fileName: attachment.title,
						mimeType: attachment.mimetype,
					};
				}
			}
		}
		if (Object.keys(element.binary as IBinaryKeyData).length === 0) {
			delete element.binary;
		}
		elements.push(element);
	}
	return elements;
}
