import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
	resolve: {
		alias: {
			'@langchain/langgraph': '@langchain/langgraph/web',
			'@langchain/langgraph/prebuilt': '@langchain/langgraph/prebuilt/web',
		},
	},
});
