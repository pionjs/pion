const phaseSymbol = Symbol("haunted.phase");
const hookSymbol = Symbol("haunted.hook");

const updateSymbol = Symbol("haunted.update");
const commitSymbol = Symbol("haunted.commit");
const effectsSymbol = Symbol("haunted.effects");
const layoutEffectsSymbol = Symbol("haunted.layoutEffects");

type EffectsSymbols = typeof effectsSymbol | typeof layoutEffectsSymbol;
type Phase = typeof updateSymbol | typeof commitSymbol | typeof effectsSymbol;

const contextEvent = "haunted.context";

/**
 * Symbol used to store the renderer function on the Element class.
 * Used by HMR runtime to extract and replace renderers.
 */
const rendererSymbol = Symbol("pion.renderer");

/**
 * Symbol used to store the HMR tag name on element instances.
 * Used by HMR runtime for instance tracking.
 */
const hmrTagSymbol = Symbol("pion.hmrTag");

export {
  phaseSymbol,
  hookSymbol,
  updateSymbol,
  commitSymbol,
  effectsSymbol,
  layoutEffectsSymbol,
  contextEvent,
  rendererSymbol,
  hmrTagSymbol,
  Phase,
  EffectsSymbols,
};
