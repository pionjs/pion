import { hook, Hook } from "./hook";
import { State } from "./state";

type UseHost = <T extends HTMLElement = HTMLElement>() => T;

export const useHost: UseHost = hook(
  class extends Hook {
    update() {
      return this.state.host;
    }
  }
) as UseHost;
