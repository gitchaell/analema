import tailwind from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	output: 'static',
	build: {
		assets: 'assets',
	},
	vite: {
		plugins: [tailwind()],
	},
})
