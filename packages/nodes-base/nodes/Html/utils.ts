import type { IDataObject } from 'n8n-workflow';
import type { IValueData, Cheerio } from './types';

/**
 * @TECH_DEBT Explore replacing with handlebars
 */
export function getResolvables(html: string) {
	const resolvables = [];

	for (let i = 0; i < html.length; i++) {
		if (html[i] === '{' && html[i + 1] === '{') {
			const startIndex = i;
			let endIndex = -1;

			i += 2;

			while (html[i] !== '}' && html[i + 1] !== '}') {
				i++;
			}

			i += 3;
			endIndex = i;

			resolvables.push(html.slice(startIndex, endIndex));
		}
	}

	return resolvables;
}

// The extraction functions
const extractFunctions: {
	[key: string]: ($: Cheerio, valueData: IValueData) => string | undefined;
} = {
	attribute: ($: Cheerio, valueData: IValueData): string | undefined =>
		$.attr(valueData.attribute!),
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	html: ($: Cheerio, _valueData: IValueData): string | undefined => $.html() || undefined,
	text: ($: Cheerio, _valueData: IValueData): string | undefined => $.text(),
	value: ($: Cheerio, _valueData: IValueData): string | undefined => $.val(),
};

/**
 * Simple helper function which applies options
 */
export function getValue($: Cheerio, valueData: IValueData, options: IDataObject) {
	const value = extractFunctions[valueData.returnValue]($, valueData);
	if (options.trimValues === false || value === undefined) {
		return value;
	}

	return value.trim();
}
