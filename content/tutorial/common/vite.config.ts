import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit()
	],
	resolve: {
		alias: {
			stream: 'stream-browserify'
		}
	},
	define: {
		global: 'global',
	},
	// Normally this would be unnecessary, but we
	// need it for learn.svelte.dev
	server: {
		fs: {
			strict: false
		}
	}
});
