import * as tagsApi from '@/api/tags';
import { STORES } from '@/constants';
import type { ITag } from '@/Interface';
import { defineStore } from 'pinia';
import { useRootStore } from './root.store';
import { computed, ref } from 'vue';
import { useWorkflowsStore } from './workflows.store';

export const useTagsStore = defineStore(STORES.TAGS, () => {
	const tags = ref<{ [id: string]: ITag }>({});
	const loading = ref(false);
	const fetchedAll = ref(false);
	const fetchedUsageCount = ref(false);

	const rootStore = useRootStore();
	const workflowsStore = useWorkflowsStore();

	// Computed

	const allTags = computed(() => {
		return Object.values(tags.value).sort((a, b) => a.name.localeCompare(b.name));
	});

	const isLoading = computed(() => loading.value);

	const hasTags = computed(() => Object.keys(tags.value).length > 0);

	const getTagById = computed(() => {
		return (id: string) => tags.value[id];
	});

	// Methods

	const setAllTags = (loadedTags: ITag[]) => {
		tags.value = loadedTags.reduce((accu: { [id: string]: ITag }, tag: ITag) => {
			accu[tag.id] = tag;

			return accu;
		}, {});
		fetchedAll.value = true;
	};

	const upsertTags = (toUpsertTags: ITag[]) => {
		toUpsertTags.forEach((toUpsertTag) => {
			const tagId = toUpsertTag.id;
			const currentTag = tags.value[tagId];
			if (currentTag) {
				const newTag = {
					...currentTag,
					...toUpsertTag,
				};
				tags.value = {
					...tags.value,
					[tagId]: newTag,
				};
			} else {
				tags.value = {
					...tags.value,
					[tagId]: toUpsertTag,
				};
			}
		});
	};

	const deleteTag = (id: string) => {
		const { [id]: deleted, ...rest } = tags.value;
		tags.value = rest;
	};

	const fetchAll = async (params?: { force?: boolean; withUsageCount?: boolean }) => {
		const { force = false, withUsageCount = false } = params || {};
		if (!force && fetchedAll.value && fetchedUsageCount.value === withUsageCount) {
			return Object.values(tags.value);
		}

		loading.value = true;
		const retrievedTags = await tagsApi.getTags(rootStore.restApiContext, Boolean(withUsageCount));
		setAllTags(retrievedTags);
		loading.value = false;
		return retrievedTags;
	};

	const create = async (name: string) => {
		const createdTag = await tagsApi.createTag(rootStore.restApiContext, { name });
		upsertTags([createdTag]);
		return createdTag;
	};

	const rename = async ({ id, name }: { id: string; name: string }) => {
		const updatedTag = await tagsApi.updateTag(rootStore.restApiContext, id, { name });
		upsertTags([updatedTag]);
		return updatedTag;
	};

	const deleteTagById = async (id: string) => {
		const deleted = await tagsApi.deleteTag(rootStore.restApiContext, id);

		if (deleted) {
			deleteTag(id);
			workflowsStore.removeWorkflowTagId(id);
		}

		return deleted;
	};

	return {
		allTags,
		isLoading,
		hasTags,
		getTagById,
		tags,
		fetchAll,
		create,
		rename,
		deleteTagById,
		upsertTags,
		deleteTag,
	};
});
