interface ViteEnv {
	PROD?: boolean;
	DEV?: boolean;
	MODE?: string;
}

interface ImportMeta {
	env?: ViteEnv;
}

interface ProcessEnv {
	NODE_ENV?: string;
}

// eslint-disable-next-line no-var
declare var process: { env?: ProcessEnv } | undefined;