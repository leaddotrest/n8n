import { afterAll, beforeAll } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { waitFor } from '@testing-library/vue';
import { setupServer } from '@/__tests__/server';
import VariablesView from '@/views/VariablesView.vue';
import { useSettingsStore, useRBACStore } from '@/stores';
import { createComponentRenderer } from '@/__tests__/render';
import { EnterpriseEditionFeature } from '@/constants';

describe('VariablesView', () => {
	let server: ReturnType<typeof setupServer>;
	let pinia: ReturnType<typeof createPinia>;
	let settingsStore: ReturnType<typeof useSettingsStore>;
	let rbacStore: ReturnType<typeof useRBACStore>;

	const renderComponent = createComponentRenderer(VariablesView);

	beforeAll(() => {
		server = setupServer();
	});

	beforeEach(async () => {
		pinia = createPinia();
		setActivePinia(pinia);

		settingsStore = useSettingsStore();
		rbacStore = useRBACStore();
		await settingsStore.getSettings();
	});

	afterAll(() => {
		server.shutdown();
	});

	it('should render loading state', () => {
		const wrapper = renderComponent({ pinia });

		expect(wrapper.container.querySelectorAll('.n8n-loading')).toHaveLength(3);
	});

	describe('should render empty state', () => {
		it('when feature is disabled and logged in user is not owner', async () => {
			settingsStore.settings.enterprise[EnterpriseEditionFeature.Variables] = false;
			rbacStore.setGlobalScopes(['variable:read', 'variable:list']);

			const { queryByTestId } = renderComponent({ pinia });

			await waitFor(() => {
				expect(queryByTestId('empty-resources-list')).not.toBeInTheDocument();
				expect(queryByTestId('unavailable-resources-list')).toBeVisible();
				expect(queryByTestId('cannot-create-variables')).not.toBeInTheDocument();
			});
		});

		it('when feature is disabled and logged in user is owner', async () => {
			settingsStore.settings.enterprise[EnterpriseEditionFeature.Variables] = false;
			rbacStore.setGlobalScopes([
				'variable:create',
				'variable:read',
				'variable:update',
				'variable:delete',
				'variable:list',
			]);

			const { queryByTestId } = renderComponent({ pinia });

			await waitFor(() => {
				expect(queryByTestId('empty-resources-list')).not.toBeInTheDocument();
				expect(queryByTestId('unavailable-resources-list')).toBeVisible();
				expect(queryByTestId('cannot-create-variables')).not.toBeInTheDocument();
			});
		});

		it('when feature is enabled and logged in user is owner', async () => {
			settingsStore.settings.enterprise[EnterpriseEditionFeature.Variables] = true;
			rbacStore.setGlobalScopes([
				'variable:create',
				'variable:read',
				'variable:update',
				'variable:delete',
				'variable:list',
			]);

			const { queryByTestId } = renderComponent({ pinia });

			await waitFor(() => {
				expect(queryByTestId('empty-resources-list')).not.toBeInTheDocument();
				expect(queryByTestId('unavailable-resources-list')).not.toBeInTheDocument();
				expect(queryByTestId('cannot-create-variables')).not.toBeInTheDocument();
			});
		});

		it('when feature is enabled and logged in user is not owner', async () => {
			settingsStore.settings.enterprise[EnterpriseEditionFeature.Variables] = true;
			rbacStore.setGlobalScopes(['variable:read', 'variable:list']);

			const { queryByTestId } = renderComponent({ pinia });

			await waitFor(() => {
				expect(queryByTestId('empty-resources-list')).not.toBeInTheDocument();
				expect(queryByTestId('unavailable-resources-list')).not.toBeInTheDocument();
				expect(queryByTestId('cannot-create-variables')).toBeVisible();
			});
		});
	});

	it('should render variable entries', async () => {
		server.createList('variable', 3);

		const wrapper = renderComponent({ pinia });

		const table = await wrapper.findByTestId('resources-table');
		expect(table).toBeVisible();
		expect(wrapper.container.querySelectorAll('tr')).toHaveLength(4);
	});
});
