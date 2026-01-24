// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://pionjs.github.io',
	base: '/pion',
	integrations: [
		starlight({
			title: 'pion',
			description: 'Hooks API for Web Components',
			logo: {
				src: './src/assets/logo.svg',
				alt: 'Spooky Ghost',
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/pionjs/pion',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/pionjs/pion/edit/master/docs-starlight/',
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Getting Started', slug: 'guides/getting-started' },
						{ label: 'Bring your Own Renderer', slug: 'guides/renderers' },
						{ label: 'Attributes', slug: 'guides/attributes' },
						{ label: 'Properties', slug: 'guides/properties' },
						{ label: 'API', slug: 'guides/api' },
						{ label: 'Dispatching Events', slug: 'guides/events' },
						{ label: 'Virtual Components', slug: 'guides/virtual' },
						{ label: 'TypeScript', slug: 'guides/typescript' },
					],
				},
				{
					label: 'Hooks',
					items: [
						{ label: 'useState', slug: 'hooks/use-state' },
						{ label: 'useEffect', slug: 'hooks/use-effect' },
						{ label: 'useContext', slug: 'hooks/use-context' },
						{ label: 'useCallback', slug: 'hooks/use-callback' },
						{ label: 'useMemo', slug: 'hooks/use-memo' },
						{ label: 'useReducer', slug: 'hooks/use-reducer' },
						{ label: 'useRef', slug: 'hooks/use-ref' },
						{ label: 'useLayoutEffect', slug: 'hooks/use-layout-effect' },
					],
				},
			],
		}),
	],
});
