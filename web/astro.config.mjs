import { defineConfig } from 'astro/config'
import tailwind from '@tailwindcss/vite'

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
