/**
 * @return {import('@custom-elements-manifest/analyzer').Plugin}
 */
function jsdocFunctionPlugin() {
  return {
    name: "jsdoc-function",
    analyzePhase({ ts, node, moduleDoc }) {
      if (ts.isVariableStatement(node)) {
        // @ts-expect-error: it very well might
        const comments = node.jsDoc ?? [];
        const tags = comments.flatMap((x) => x.tags ?? []);
        if (tags.some((x) => x.tagName?.getText?.() === "function")) {
          const { declarations } = node.declarationList;
          if (declarations.length > 1) return;
          const [{ name }] = declarations;
          const doc = moduleDoc.declarations.find(
            (d) => d.name === name.getText()
          );
          doc.kind = "function";
        }
      }
    },
  };
}

/** @type {{ plugins: import('@custom-elements-manifest/analyzer').Plugin[] }} */
export default {
  globs: ["haunted.js", "core.js", "lib/*.js"],
  plugins: [jsdocFunctionPlugin()],
};
