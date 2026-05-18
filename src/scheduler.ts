import { State } from "./state";
import {
  commitSymbol,
  phaseSymbol,
  updateSymbol,
  effectsSymbol,
  Phase,
  layoutEffectsSymbol,
  EffectsSymbols,
} from "./symbols";
import { GenericRenderer, ComponentOrVirtualComponent } from "./core";
import { InfiniteLoopError } from "./errors";
import { ChildPart } from "lit-html";

const MAX_UPDATES = 100;

const defer = Promise.resolve().then.bind(Promise.resolve());

function runner() {
  let tasks: VoidFunction[] = [];
  let id: Promise<void> | null;

  function runTasks() {
    id = null;
    let t = tasks;
    tasks = [];
    for (var i = 0, len = t.length; i < len; i++) {
      t[i]();
    }
  }

  return function (task: VoidFunction) {
    tasks.push(task);
    if (id == null) {
      id = defer(runTasks);
    }
  };
}

const read = runner();
const write = runner();

abstract class BaseScheduler<
  P extends object,
  T extends HTMLElement | ChildPart,
  R extends GenericRenderer<T, P>,
  H extends ComponentOrVirtualComponent<T, P>
> {
  renderer: R;
  host: H;
  state: State<H>;
  [phaseSymbol]: Phase | null;
  _updateQueued: boolean;
  _active: boolean;
  _updateCount: number;
  _processing: boolean;
  static maxUpdates: number = MAX_UPDATES;

  constructor(renderer: R, host: H) {
    this.renderer = renderer;
    this.host = host;
    this.state = new State(this.update.bind(this), host);
    this[phaseSymbol] = null;
    this._updateQueued = false;
    this._active = false;
    this._updateCount = 0;
    this._processing = false;
  }

  private _checkForInfiniteLoop(): void {
    if (!this._processing) {
      this._updateCount = 0;
    }
    this._updateCount++;
    if (this._updateCount > BaseScheduler.maxUpdates) {
      const tagName =
        this.host instanceof HTMLElement
          ? this.host.tagName.toLowerCase()
          : undefined;
      this._active = false;
      throw new InfiniteLoopError(tagName);
    }
  }

  update(): void {
    if (!this._active) return;
    if (this._updateQueued) return;

    this._checkForInfiniteLoop();

    this._processing = true;
    read(() => {
      let result = this.handlePhase(updateSymbol);
      write(() => {
        this.handlePhase(commitSymbol, result);

        write(() => {
          this.handlePhase(effectsSymbol);
          if (!this._updateQueued) {
            this._processing = false;
          }
        });
      });
      this._updateQueued = false;
    });
    this._updateQueued = true;
  }

  handlePhase(phase: typeof commitSymbol, arg: unknown): void;
  handlePhase(phase: typeof updateSymbol): unknown;
  handlePhase(phase: typeof effectsSymbol): void;
  handlePhase(phase: Phase, arg?: unknown) {
    this[phaseSymbol] = phase;
    switch (phase) {
      case commitSymbol:
        this.commit(arg);
        this.runEffects(layoutEffectsSymbol);
        return;
      case updateSymbol:
        return this.render();
      case effectsSymbol:
        return this.runEffects(effectsSymbol);
    }
  }

  render(): unknown {
    return this.state.run(() => this.renderer.call(this.host, this.host));
  }

  runEffects(phase: EffectsSymbols): void {
    this.state._runEffects(phase);
  }

  abstract commit(result: unknown): void;

  teardown(): void {
    this.state.teardown();
    this._updateCount = 0;
    this._processing = false;
  }

  pause(): void {
    this._active = false;
  }

  resume(): void {
    this._active = true;
    this._updateCount = 0;
  }
}

export { BaseScheduler };
