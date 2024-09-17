import type { Redis as SingleNodeClient } from 'ioredis';
import { mock } from 'jest-mock-extended';
import { v4 as generateNanoId } from 'uuid';

import config from '@/config';
import type { RedisClientService } from '@/services/redis/redis-client.service';
import type {
	RedisServiceCommandObject,
	RedisServiceWorkerResponseObject,
} from '@/services/redis/redis-service-commands';

import { Publisher } from '../pubsub/publisher.service';

describe('Publisher', () => {
	let queueModeId: string;
	beforeAll(() => {
		config.set('executions.mode', 'queue');
		queueModeId = generateNanoId();
		config.set('redis.queueModeId', queueModeId);
	});

	const client = mock<SingleNodeClient>();
	const redisClientService = mock<RedisClientService>({ createClient: () => client });

	describe('constructor', () => {
		it('should init Redis client in scaling mode', () => {
			const publisher = new Publisher(mock(), redisClientService);

			expect(publisher.getClient()).toEqual(client);
		});

		it('should not init Redis client in regular mode', () => {
			config.set('executions.mode', 'regular');
			const publisher = new Publisher(mock(), redisClientService);

			expect(publisher.getClient()).toBeUndefined();

			config.set('executions.mode', 'queue');
		});
	});

	describe('shutdown', () => {
		it('should disconnect Redis client', () => {
			const publisher = new Publisher(mock(), redisClientService);
			publisher.shutdown();
			expect(client.disconnect).toHaveBeenCalled();
		});
	});

	describe('publishCommand', () => {
		it('should publish command into `n8n.commands` pubsub channel', async () => {
			const publisher = new Publisher(mock(), redisClientService);
			const msg = mock<RedisServiceCommandObject>({ command: 'reloadLicense' });

			await publisher.publishCommand(msg);

			expect(client.publish).toHaveBeenCalledWith(
				'n8n.commands',
				JSON.stringify({ ...msg, senderId: queueModeId }),
			);
		});
	});

	describe('publishWorkerResponse', () => {
		it('should publish worker response into `n8n.worker-response` pubsub channel', async () => {
			const publisher = new Publisher(mock(), redisClientService);
			const msg = mock<RedisServiceWorkerResponseObject>({
				command: 'reloadExternalSecretsProviders',
			});

			await publisher.publishWorkerResponse(msg);

			expect(client.publish).toHaveBeenCalledWith('n8n.worker-response', JSON.stringify(msg));
		});
	});
});
