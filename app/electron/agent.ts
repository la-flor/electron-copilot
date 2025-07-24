import { ChatOllama } from '@langchain/community/chat_models/ollama';
import {
	AIMessage,
	BaseMessage,
	HumanMessage,
	ToolMessage,
} from '@langchain/core/messages';
import { type Runnable } from '@langchain/core/runnables';
import { END, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { IpcMain } from 'electron';
import { tools } from './tools';

export interface AgentState {
	messages: BaseMessage[];
}

// Determines whether to continue or end the agent run.
const shouldContinue = (state: AgentState) => {
	const { messages } = state;
	const lastMessage = messages[messages.length - 1];
	// If the model did not make a tool call, then we end the agent run.
	if (
		!(lastMessage as AIMessage).tool_calls ||
		(lastMessage as AIMessage).tool_calls.length === 0
	) {
		return 'end';
	}
	// Otherwise, we continue.
	return 'continue';
};

// Calls the model with the current state.
const callModel = async (state: AgentState, model: Runnable) => {
	const { messages } = state;
	const response = await model.invoke(messages);
	return { messages: [response] };
};

async function createAgentExecutor(
	provider: 'ollama',
	modelName: string,
): Promise<Runnable<AgentState, AgentState>> {
	if (provider !== 'ollama') {
		throw new Error(
			'Only Ollama provider is supported for the agent currently.',
		);
	}

	const model = new ChatOllama({ model: modelName }).bindTools(tools);
	const toolNode = new ToolNode(tools);

	const workflow = new StateGraph<AgentState>({
		channels: {
			messages: {
				value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
				default: (): BaseMessage[] => [],
			},
		},
	});

	workflow.addNode('agent', (state) => callModel(state, model));
	workflow.addNode('action', toolNode);

	workflow.setEntryPoint('agent');
	workflow.addConditionalEdges('agent', shouldContinue, {
		continue: 'action',
		end: END,
	});
	workflow.addEdge('action', 'agent');

	return workflow.compile();
}

// Helper to deserialize messages from plain objects sent over IPC
function deserializeMessages(messages: any[]): BaseMessage[] {
	return messages.map((msg) => {
		const content = msg.content || '';
		if (msg.type === 'human') {
			return new HumanMessage({ content });
		} else if (msg.type === 'ai') {
			return new AIMessage({ content, tool_calls: msg.tool_calls });
		} else if (msg.type === 'tool') {
			return new ToolMessage({ content, tool_call_id: msg.tool_call_id });
		}
		return new HumanMessage({ content }); // Fallback
	});
}

export function registerAgentHandlers(ipcMain: IpcMain) {
	ipcMain.on(
		'agent:stream',
		async (
			event,
			{
				channel,
				userInput,
				options,
			}: {
				channel: string;
				userInput: string;
				options: { provider: 'ollama'; model: string; history: any[] };
			},
		) => {
			try {
				const app = await createAgentExecutor(options.provider, options.model);
				const history = deserializeMessages(options.history);

				const stream = await app.stream(
					{ messages: [...history, new HumanMessage(userInput)] },
					{ recursionLimit: 10 },
				);

				for await (const streamEvent of stream) {
					const lastNodeOutput = Object.values(streamEvent)[0];
					if (lastNodeOutput) {
						const lastMessage =
							lastNodeOutput.messages &&
							lastNodeOutput.messages[lastNodeOutput.messages.length - 1];
						if (
							lastMessage &&
							lastMessage.role === 'ai' &&
							!(lastMessage as AIMessage).tool_calls
						) {
							event.sender.send(`${channel}-data`, {
								chunk: lastMessage.content as string,
							});
						}
					}
				}
				event.sender.send(`${channel}-end`);
			} catch (error) {
				console.error('Agent stream error:', error);
				event.sender.send(`${channel}-error`, { message: error.message });
			}
		},
	);
}
