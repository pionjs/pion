import { html, render } from "lit-html";
import pion from "./core";
import { makeVirtual } from "./virtual";

const { component, debugComponent, createContext } = pion({ render });

const virtual = makeVirtual();

export {
  component,
  debugComponent,
  createContext,
  virtual,
  html,
  render,
};
