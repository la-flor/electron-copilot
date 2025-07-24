import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { type Runnable } from '@langchain/core/runnables';
import { END, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from './tools';

export interface AgentState {
	messages: BaseMessage[];
}

// Determines whether to continue or end the agent run.
const shouldContinue = (state: AgentState) => {
	const { messages } = state;
	const lastMessage = messages[messages.length - 1];
	// If the model did not make a tool call, then we end the agent run.
	if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
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
		throw new Error('Only Ollama provider is supported for the agent currently.');
	}

	const model = new ChatOllama({ model: modelName }).bindTools(tools);
	const toolNode = new ToolNode(tools);

	const workflow = new StateGraph<AgentState>({
		channels: {
			messages: {
				value: (x, y) => x.concat(y),
				default: () => [],
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

export async function* streamAgentResponse(
	userInput: string,
	options: {
		provider: 'ollama';
		model: string;
		history: BaseMessage[];
	},
) {
	const app = await createAgentExecutor(options.provider, options.model);

	const stream = await app.stream(
		{
			messages: [...options.history, new HumanMessage(userInput)],
		},
		{ recursionLimit: 5 },
	);

	for await (const event of stream) {
		const lastNodeOutput = Object.values(event)[0];
		if (lastNodeOutput) {
			const lastMessage =
				lastNodeOutput.messages &&
				lastNodeOutput.messages[lastNodeOutput.messages.length - 1];
			// We only want to yield the final AI response to the user.
			if (
				lastMessage &&
				lastMessage.role === 'ai' &&
				!lastMessage.tool_calls
			) {
				yield { chunk: lastMessage.content as string };
			}
		}
	}
}
