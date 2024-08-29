import type { Schema } from '@/Interface';
import type { INode, INodeParameters } from 'n8n-workflow';

export namespace ChatRequest {
	interface NodeExecutionSchema {
		nodeName: string;
		schema: Schema;
	}

	export interface WorkflowContext {
		executionSchema?: NodeExecutionSchema[];
	}

	export interface ErrorContext {
		error: {
			name: string;
			message: string;
			type?: string;
			description?: string | null;
			lineNumber?: number;
			stack?: string;
		};
		node: INode;
	}

	export interface InitErrorHelper extends ErrorContext, WorkflowContext {
		role: 'user';
		type: 'init-error-helper';
		user: {
			firstName: string;
		};
		authType?: { name: string; value: string };
	}

	export type InteractionEventName = 'node-execution-succeeded' | 'node-execution-errored';

	interface EventRequestPayload {
		role: 'user';
		type: 'event';
		eventName: InteractionEventName;
		error?: ErrorContext['error'];
	}

	export interface UserChatMessage {
		role: 'user';
		type: 'message';
		text: string;
		quickReplyType?: string;
	}

	export type RequestPayload =
		| {
				payload: InitErrorHelper;
		  }
		| {
				payload: EventRequestPayload | UserChatMessage;
				sessionId: string;
		  };

	interface CodeDiffMessage {
		role: 'assistant';
		type: 'code-diff';
		description?: string;
		codeDiff?: string;
		suggestionId: string;
		solution_count: number;
	}

	interface QuickReplyOption {
		text: string;
		type: string;
		isFeedback?: boolean;
	}

	interface AssistantChatMessage {
		role: 'assistant';
		type: 'message';
		text: string;
		step?: 'n8n_documentation' | 'n8n_forum';
	}

	interface AssistantSummaryMessage {
		role: 'assistant';
		type: 'summary';
		title: string;
		content: string;
	}

	interface EndSessionMessage {
		role: 'assistant';
		type: 'event';
		eventName: 'end-session';
	}

	interface AgentChatMessage {
		role: 'assistant';
		type: 'agent-suggestion';
		title: string;
		text: string;
	}
	export type MessageResponse =
		| ((AssistantChatMessage | CodeDiffMessage | AssistantSummaryMessage | AgentChatMessage) & {
				quickReplies?: QuickReplyOption[];
		  })
		| EndSessionMessage;

	export interface ResponsePayload {
		sessionId?: string;
		messages: MessageResponse[];
	}
}

export namespace ReplaceCodeRequest {
	export interface RequestPayload {
		sessionId: string;
		suggestionId: string;
	}

	export interface ResponsePayload {
		sessionId: string;
		parameters: INodeParameters;
	}
}
