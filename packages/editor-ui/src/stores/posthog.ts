import { ref, Ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useUsersStore } from '@/stores/users';
import { useRootStore } from '@/stores/n8nRootStore';
import { useSettingsStore } from './settings';
import { FeatureFlags } from 'n8n-workflow';
import { EXPERIMENTS_TO_TRACK } from '@/constants';
import { useTelemetryStore } from './telemetry';

export const usePostHogStore = defineStore('posthog', () => {
	const usersStore = useUsersStore();
	const settingsStore = useSettingsStore();
	const telemetryStore = useTelemetryStore();
	const rootStore = useRootStore();

	const featureFlags: Ref<FeatureFlags | null> = ref(null);
	const initialized: Ref<boolean> = ref(false);
	const trackedDemoExp: Ref<FeatureFlags> = ref({});

	const onLogout = () => {
		window.posthog?.reset?.();
		featureFlags.value = null;
		trackedDemoExp.value = {};
	};

	const getVariant = (experiment: string): string | boolean | undefined => {
		return featureFlags.value?.[experiment];
	};

	const isVariantEnabled = (experiment: string, variant: string) => {
		return getVariant(experiment) === variant;
	};

	const identify = () => {
		const instanceId = rootStore.instanceId;
		const user = usersStore.currentUser;
		const traits: Record<string, string | number> = { instance_id: instanceId };

		// todo check why Date is used there
		if (user && user.createdAt instanceof Date) {
			traits.created_at_timestamp = user.createdAt.getTime();
		} else if (user && typeof user.createdAt === 'string') {
			traits.created_at_timestamp = new Date(user.createdAt).getTime();
		}

		// For PostHog, main ID _cannot_ be `undefined` as done for RudderStack.
		let id = user ? `${instanceId}#${user.id}` : instanceId;
		window.posthog?.identify?.(id, traits);
	};

	const init = (bootstrapped?: FeatureFlags) => {
		if (!window.posthog) {
			return;
		}

		const config = settingsStore.settings.posthog;
		if (!config.enabled) {
			return;
		}

		const userId = usersStore.currentUserId;
		if (!userId) {
			return;
		}

		const instanceId = rootStore.instanceId;
		const distinctId = `${instanceId}#${userId}`;

		const options: Parameters<typeof window.posthog.init>[1] = {
			api_host: config.apiHost,
			autocapture: config.autocapture,
			disable_session_recording: config.disableSessionRecording,
			debug: config.debug
		};

		if (bootstrapped) {
			featureFlags.value = bootstrapped;
			options.bootstrap = {
				distinctId,
				featureFlags: bootstrapped,
			};
		}

		window.posthog?.init(config.apiKey, options);

		identify();
		if (!initialized.value) {
			window.posthog?.onFeatureFlags?.((flags: string[], map: FeatureFlags) => {
				featureFlags.value = map;
			});
		}

		initialized.value = true;
	};

	const trackExperiment = (name: string) => {
		const curr = featureFlags.value;
		const prev = trackedDemoExp.value;

		if (!curr || curr[name] === undefined) {
			return;
		}

		if (curr[name] === prev[name]) {
			return;
		}

		const variant = curr[name];
		telemetryStore.track('User is part of experiment', {
			name,
			variant,
		});

		trackedDemoExp.value[name] = variant;
	}

	watch(
		() => featureFlags.value,
		() => {
			setTimeout(() => {
				EXPERIMENTS_TO_TRACK.forEach(trackExperiment);
			}, 0);
		}
	);

	watch(
		() => usersStore.currentUserId,
		(userId, prevId) => {
			if (!userId && prevId) {
				onLogout();
			}
		},
	);

	return {
		init,
		isVariantEnabled,
		getVariant,
	};
});
