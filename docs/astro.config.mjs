import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://pionjs.github.io/pion',
  integrations: [
    starlight({
      title: 'pion',
      tagline: 'Hooks for Web Components',
      logo: {
        src: './src/assets/logo.svg',
      },
      social: {
        github: 'https://github.com/pionjs/pion',
      },
      components: {
        PageFrame: './src/components/PageFrame.astro',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Getting Started', slug: 'guides/getting-started' },
            { label: 'Bring Your Own Renderer', slug: 'guides/renderers' },
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
            { label: 'useCallback', slug: 'hooks/usecallback' },
            { label: 'useContext', slug: 'hooks/usecontext' },
            { label: 'useEffect', slug: 'hooks/useeffect' },
            { label: 'useHost', slug: 'hooks/usehost' },
            { label: 'useLayoutEffect', slug: 'hooks/uselayouteffect' },
            { label: 'useMemo', slug: 'hooks/usememo' },
            { label: 'useProperty', slug: 'hooks/useproperty' },
            { label: 'useReducer', slug: 'hooks/usereducer' },
            { label: 'useRef', slug: 'hooks/useref' },
            { label: 'useState', slug: 'hooks/usestate' },
          ],
        },
      ],
    }),
  ],
});
