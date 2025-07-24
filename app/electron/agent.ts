import {
	AIMessage,
	BaseMessage,
	HumanMessage,
	ToolMessage,
} from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOllama } from '@langchain/ollama';
import { IpcMain } from 'electron';
import { tools } from './tools';

export interface AgentState {
	messages: BaseMessage[];
}

async function createAgentExecutor(provider: 'ollama', modelName: string) {
	if (provider !== 'ollama') {
		throw new Error(
			'Only Ollama provider is supported for the agent currently.',
		);
	}

	const model = new ChatOllama({ model: modelName });

	const agent = createReactAgent({ llm: model, tools });

	return agent;
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

				let allMessages: BaseMessage[] = [...history, new HumanMessage(userInput)];
				let streamedContent = '';
				let hasReceivedData = false;
				
				for await (const streamEvent of stream) {
					hasReceivedData = true;
					
					// Handle different node outputs in the stream
					for (const [nodeName, nodeOutput] of Object.entries(streamEvent)) {
						// LangGraph may structure messages differently
						if (nodeOutput && Array.isArray(nodeOutput.messages)) {
							allMessages = nodeOutput.messages;
							const lastMessage = allMessages[allMessages.length - 1];
							
							if (lastMessage && lastMessage._getType() === 'ai') {
								const aiMessage = lastMessage as AIMessage;
								
								// Handle AI text content
								const latestContent = aiMessage.content as string;
								if (latestContent && latestContent.length > streamedContent.length) {
									const chunk = latestContent.substring(streamedContent.length);
									event.sender.send(`${channel}-data`, { chunk });
									streamedContent = latestContent;
								}
							}
						}
					}
				}
				
				if (!hasReceivedData) {
					event.sender.send(`${channel}-data`, { chunk: 'No response received from agent.' });
				}
				event.sender.send(`${channel}-end`);
			} catch (error) {
				console.error('Agent stream error:', error);
				event.sender.send(`${channel}-error`, { message: error.message });
			}
		},
	);
}
