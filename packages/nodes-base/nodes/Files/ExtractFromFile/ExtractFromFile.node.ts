import { BINARY_ENCODING, NodeOperationError, deepCopy, jsonParse } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';

import iconv from 'iconv-lite';

import * as fromFile from '../../SpreadsheetFile/v2/fromFile.operation';
import { encodeDecodeOptions } from '../../../utils/descriptions';
import { extractDataFromPDF } from '../../../utils/binary';

const spreadsheetOperations = ['csv', 'html', 'rtf', 'ods', 'xls', 'xlsx'];

const spreadsheetOperationsDescription = fromFile.description
	.filter((property) => property.name !== 'fileFormat')
	.map((property) => {
		const newProperty = { ...property };
		newProperty.displayOptions = {
			show: {
				operation: spreadsheetOperations,
			},
		};

		if (newProperty.name === 'options') {
			newProperty.options = (newProperty.options as INodeProperties[]).map((option) => {
				let newOption = option;
				if (['delimiter', 'fromLine', 'maxRowCount', 'enableBOM'].includes(option.name)) {
					newOption = { ...option, displayOptions: { show: { '/operation': ['csv'] } } };
				}
				return newOption;
			});
		}
		return newProperty;
	});

export class ExtractFromFile implements INodeType {
	// eslint-disable-next-line n8n-nodes-base/node-class-description-missing-subtitle
	description: INodeTypeDescription = {
		displayName: 'Extract From File',
		name: 'extractFromFile',
		icon: 'fa:file-export',
		group: ['input'],
		version: 1,
		description: 'Convert binary data to JSON',
		defaults: {
			name: 'Extract From File',
			color: '#999999',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{
						name: 'Extract From CSV',
						value: 'csv',
						action: 'Extract from CSV',
					},
					{
						name: 'Extract From HTML',
						value: 'html',
						action: 'Extract from HTML',
					},
					{
						name: 'Extract From JSON',
						value: 'fromJson',
						action: 'Extract from JSON',
					},
					{
						name: 'Extract From ODS',
						value: 'ods',
						action: 'Extract from ODS',
					},
					{
						name: 'Extract From PDF',
						value: 'pdf',
						action: 'Extract from PDF',
					},
					{
						name: 'Extract From RTF',
						value: 'rtf',
						action: 'Extract from RTF',
					},
					{
						name: 'Extract From XLS',
						value: 'xls',
						action: 'Extract from XLS',
					},
					{
						name: 'Extract From XLSX',
						value: 'xlsx',
						action: 'Extract from XLSX',
					},
					{
						name: 'Extract From Text File',
						value: 'text',
						action: 'Extract from Text File',
					},
					{
						name: 'Move File to Base64 String',
						value: 'binaryToPropery',
						action: 'Move file to base64 string',
					},
				],
				default: 'csv',
			},
			...spreadsheetOperationsDescription,
			{
				displayName: 'File Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				placeholder: 'e.g data',
				description: 'Name of the binary property from which to extract the data',
				displayOptions: {
					show: {
						operation: ['binaryToPropery', 'fromJson', 'pdf', 'text'],
					},
				},
			},
			{
				displayName: 'Destination Key',
				name: 'destinationKey',
				type: 'string',
				default: 'data',
				required: true,
				placeholder: 'e.g data',
				description: 'The name of the JSON key to which extracted data would be written',
				displayOptions: {
					show: {
						operation: ['binaryToPropery', 'fromJson', 'text'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['binaryToPropery', 'fromJson', 'text'],
					},
				},
				options: [
					{
						displayName: 'Encoding',
						name: 'encoding',
						type: 'options',
						options: encodeDecodeOptions,
						default: 'utf8',
						description: 'Set the encoding of the data stream',
					},
					{
						displayName: 'Strip BOM',
						name: 'stripBOM',
						displayOptions: {
							show: {
								encoding: ['utf8', 'cesu8', 'ucs2'],
							},
						},
						type: 'boolean',
						default: true,
					},
					{
						displayName: 'Keep Source',
						name: 'keepSource',
						type: 'options',
						default: 'json',
						options: [
							{
								name: 'JSON',
								value: 'json',
							},
							{
								name: 'Binary',
								value: 'binary',
							},
							{
								name: 'Both',
								value: 'both',
							},
						],
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['pdf'],
					},
				},
				options: [
					{
						displayName: 'Password',
						name: 'password',
						type: 'string',
						typeOptions: { password: true },
						default: '',
						description: 'Prowide password, if the PDF is encrypted',
					},
					{
						displayName: 'Join Pages',
						name: 'joinPages',
						type: 'boolean',
						default: true,
						description:
							'Whether to join the text from all pages or return an array of text from each page',
					},
					{
						displayName: 'Max Pages',
						name: 'maxPages',
						type: 'number',
						default: 0,
						description: 'Maximum number of pages to include',
					},
					{
						displayName: 'Keep Source',
						name: 'keepSource',
						type: 'options',
						default: 'json',
						options: [
							{
								name: 'JSON',
								value: 'json',
							},
							{
								name: 'Binary',
								value: 'binary',
							},
							{
								name: 'Both',
								value: 'both',
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		let returnData: INodeExecutionData[] = [];

		if (spreadsheetOperations.includes(operation)) {
			returnData = await fromFile.execute.call(this, items, operation);
		}

		if (['binaryToPropery', 'fromJson', 'text'].includes(operation)) {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				const item = items[itemIndex];
				const options = this.getNodeParameter('options', itemIndex);
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex);

				const newItem: INodeExecutionData = {
					json: {},
					pairedItem: { item: itemIndex },
				};

				const value = get(item.binary, binaryPropertyName);

				if (!value) continue;

				const encoding = (options.encoding as string) || 'utf8';
				const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

				if (options.keepSource && options.keepSource !== 'binary') {
					newItem.json = deepCopy(item.json);
				}

				let convertedValue: string | IDataObject;
				if (operation !== 'binaryToPropery') {
					convertedValue = iconv.decode(buffer, encoding, {
						stripBOM: options.stripBOM as boolean,
					});
				} else {
					convertedValue = Buffer.from(buffer).toString(BINARY_ENCODING);
				}

				if (operation === 'fromJson') {
					convertedValue = jsonParse(convertedValue);
				}

				const destinationKey = this.getNodeParameter('destinationKey', itemIndex, '') as string;
				set(newItem.json, destinationKey, convertedValue);

				if (options.keepSource === 'binary' || options.keepSource === 'both') {
					newItem.binary = item.binary;
				} else {
					// this binary data would not be included, but there also might be other binary data
					// which should be included, copy it over and unset current binary data
					newItem.binary = deepCopy(item.binary);
					unset(newItem.binary, binaryPropertyName);
				}

				returnData.push(newItem);
			}
		}

		if (operation === 'pdf') {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					const item = items[itemIndex];
					const options = this.getNodeParameter('options', itemIndex);
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex);

					const json = await extractDataFromPDF.call(
						this,
						binaryPropertyName,
						options.password as string,
						options.maxPages as number,
						options.joinPages as boolean,
						itemIndex,
					);

					const newItem: INodeExecutionData = {
						json: {},
						pairedItem: { item: itemIndex },
					};

					if (options.keepSource && options.keepSource !== 'binary') {
						newItem.json = { ...deepCopy(item.json), ...json };
					} else {
						newItem.json = json;
					}

					if (options.keepSource === 'binary' || options.keepSource === 'both') {
						newItem.binary = item.binary;
					} else {
						// this binary data would not be included, but there also might be other binary data
						// which should be included, copy it over and unset current binary data
						newItem.binary = deepCopy(item.binary);
						unset(newItem.binary, binaryPropertyName);
					}

					returnData.push(newItem);
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({
							json: {
								error: error.message,
							},
							pairedItem: {
								item: itemIndex,
							},
						});
						continue;
					}
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}
