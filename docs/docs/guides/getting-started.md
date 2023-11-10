# Guides >> Getting Started || 00

A starter app is available on [codesandbox](https://codesandbox.io/s/github/pionjs/pion-starter-app/tree/master/) and also can be cloned from [this repo](https://github.com/pionjs/pion-starter-app). This app gives you the basics of how to use pion and build components.

## Use

<code-tabs collection="package-managers" default-tab="npm" align="end">

```shell tab npm
npm install @pionjs/pion
```

```shell tab yarn
yarn add @pionjs/pion
```

```shell tab pnpm
pnpm add @pionjs/pion
```

</code-tabs>

For Internet Explorer 11, you'll need to use a proxy polyfill to use pion, in addition to the usual webcomponentsjs polyfills.

```html
<script src="https://cdn.jsdelivr.net/npm/proxy-polyfill@0.3.0/proxy.min.js"></script>
```

Here is a [full example of a web app that uses a build for Internet Explorer 11](https://github.com/crisward/haunted-ie11). You can also use Custom Elements without the Shadow DOM if you need to:

```js
component(MyComponent, { useShadowDOM: false }));
```

## Importing

**pion** can be imported just like any other library when using a bundler of your choice:

```js
import {
  html,
  component,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useController,
  useContext
} from '@pionjs/pion';
```

The main entry point is intended for [lit-html](https://github.com/Polymer/lit-html) users.

## Web modules

**pion** can work directly in the browser without using any build tools. Simply import the `haunted.js` bundle. You can use the [unpkg](https://unpkg.com/) or [pika](https://www.pika.dev/cdn) CDNs. This works great for demo pages and small apps. Here's an example with unpkg:

```js
import { html } from 'https://unpkg.com/lit?module';
import { component, useState } from 'https://unpkg.com/@pionjs/pion';
```

If using pika then use the `html` export from pion, as pika bundles everything together:

```js
import { html, component, useState } from 'https://cdn.pika.dev/@pionjs/pion';
```

If you install pion **locally** this build is located at `/node_modules/@pionjs/pion/haunted.js`. And if you're using PikaPkg (@pika/web) then you'll import it from `/web_modules/haunted.js`.
