import { AwsSecretsClient } from './aws-secrets-client';
import { UnknownAuthTypeError } from '@/errors/unknown-auth-type.error';
import type { SecretsProvider, SecretsProviderState } from '@/Interfaces';
import type { IDataObject, INodeProperties } from 'n8n-workflow';
import type { AwsSecretsManagerContext } from './types';

export class AwsSecretsManager implements SecretsProvider {
	name = 'awsSecretsManager';

	displayName = 'AWS Secrets Manager';

	state: SecretsProviderState = 'initializing';

	properties: INodeProperties[] = [
		{
			displayName:
				'Need help filling out these fields? <a href="https://docs.n8n.io/external-secrets/#connect-n8n-to-your-secrets-store" target="_blank">Open docs</a>',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Region',
			name: 'region',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. eu-west-3',
		},
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'IAM User',
					value: 'iamUser',
					description:
						'Credentials for IAM user having <code>secretsmanager:ListSecrets</code> and <code>secretsmanager:BatchGetSecretValue</code> permissions. <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html" target="_blank">Learn more</a>',
				},
			],
			default: 'iamUser',
			required: true,
		},
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. ACHXUQMBAQEVTE2RKMWP',
			displayOptions: {
				show: {
					authMethod: ['token'],
				},
			},
		},
		{
			displayName: 'Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. cbmjrH/xNAjPwlQR3i/1HRSDD+esQX/Lan3gcmBc',
			typeOptions: { password: true },
			displayOptions: {
				show: {
					authMethod: ['token'],
				},
			},
		},
	];

	private cachedSecrets: Record<string, IDataObject> = {};

	private client: AwsSecretsClient;

	async init(context: AwsSecretsManagerContext) {
		this.assertAuthType(context);

		this.client = new AwsSecretsClient(context.settings);

		// @TODO

		const res = await this.client.fetchAllSecrets();

		console.log('res', res);
	}

	async test() {
		return await this.client.checkConnection();
	}

	async connect() {
		const [wasSuccessful] = await this.test();

		this.state = wasSuccessful ? 'connected' : 'error';
	}

	async disconnect() {
		return;
	}

	async update() {
		const secrets = await this.client.fetchAllSecrets();

		const newCache = Object.fromEntries(secrets.map((s) => [s.secretName, s.secretValue]));

		// this.cachedSecrets = newCache; // @TODO: Type mismatch
	}

	getSecret(name: string) {
		return this.cachedSecrets[name];
	}

	hasSecret(name: string) {
		return name in this.cachedSecrets;
	}

	getSecretNames() {
		return Object.keys(this.cachedSecrets);
	}

	private assertAuthType(context: AwsSecretsManagerContext) {
		if (context.settings.authMethod === 'iamUser') return;

		throw new UnknownAuthTypeError(context.settings.authMethod);
	}
}
