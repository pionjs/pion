import { esbuildPlugin } from "@web/dev-server-esbuild";

export default {
  coverageConfig: {
    reportDir: "coverage",
    threshold: {
      statements: 70,
      branches: 70,
      functions: 50,
      lines: 70,
    },
  },
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true })],
};
