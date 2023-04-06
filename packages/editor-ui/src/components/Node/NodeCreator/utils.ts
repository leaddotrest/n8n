import {
	NodeCreateElement,
	ActionCreateElement,
	SubcategorizedNodeTypes,
	SimplifiedNodeType,
} from '@/Interface';
import { CORE_NODES_CATEGORY } from '@/constants';
import { v4 as uuidv4 } from 'uuid';
import { INodeTypeDescription } from 'n8n-workflow';

export function transformNodeType(
	node: SimplifiedNodeType,
	subcategory?: string,
	type: 'node' | 'action' = 'node',
): NodeCreateElement | ActionCreateElement {
	const { displayName, description, name, group, icon, iconUrl, codex, defaults } = node;
	console.log('🚀 ~ file: utils.ts:17 ~ defaults:', defaults);

	const createElement: NodeCreateElement | ActionCreateElement = {
		uuid: uuidv4(),
		key: node.name,
		subcategory: subcategory ?? codex?.subcategories?.[CORE_NODES_CATEGORY]?.[0] ?? '*',
		properties: {
			// ...node,
			defaults,
			displayName,
			description,
			name,
			group,
			icon,
			iconUrl,
			codex,
		},
		type,
	};

	return type === 'action'
		? (createElement as ActionCreateElement)
		: (createElement as NodeCreateElement);
}
export function subcategorizeItems(items: SimplifiedNodeType[]) {
	return items.reduce((acc: SubcategorizedNodeTypes, item) => {
		// Only Core Nodes subcategories are valid, others are uncategorized
		const isCoreNodesCategory = item.codex?.categories?.includes(CORE_NODES_CATEGORY);
		const subcategories = isCoreNodesCategory
			? item?.codex?.subcategories?.[CORE_NODES_CATEGORY] ?? []
			: ['*'];

		subcategories.forEach((subcategory: string) => {
			if (!acc[subcategory]) {
				acc[subcategory] = [];
			}
			acc[subcategory].push(transformNodeType(item, subcategory));
		});

		return acc;
	}, {});
}

export function sortNodeCreateElements(nodes: NodeCreateElement[]) {
	return nodes.sort((a, b) => {
		if (a.type !== 'node' || b.type !== 'node') return -1;
		const displayNameA = a.properties.displayName.toLowerCase();
		const displayNameB = b.properties.displayName.toLowerCase();

		return displayNameA.localeCompare(displayNameB, undefined, { sensitivity: 'base' });
	});
}
