import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
	build: {
		rollupOptions: {
			input: './app/electron/preload.ts',
			output: { format: 'esm', entryFileNames: '[name].mjs' },
		},
	},
});
