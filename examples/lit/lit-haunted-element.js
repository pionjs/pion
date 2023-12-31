import { LitElement } from 'https://unpkg.com/lit?module';
import { State } from '../../haunted.js';

export default class LitHauntedElement extends LitElement {
  constructor() {
    super();

    this.haunted = new State(() => this.requestUpdate());
  }

  update(changedProperties) {
    this.haunted.run(() => super.update(changedProperties));
    this.haunted.runEffects();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.haunted.teardown();
  }
}

export const litHaunted = (renderer) => {
  return class extends LitHauntedElement {
    render() {
      return renderer.call(this, this);
    }
  }
};
