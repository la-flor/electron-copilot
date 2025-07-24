import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
	resolve: {
		alias: {
			'@langchain/core': '@langchain/core/web',
			'@langchain/community': '@langchain/community/web',
			'@langchain/langgraph': '@langchain/langgraph/web',
		},
	},
});
