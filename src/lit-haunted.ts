import { html, render } from "lit-html";
import pion from "./core";
import { makeVirtual } from "./virtual";

const { component, createContext } = pion({ render });

const virtual = makeVirtual();

export { component, createContext, virtual, html, render };
