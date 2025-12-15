import { Hook, hook } from "./hook";
import { State, Callable } from "./state";

type Effect = (this: State) => void | VoidFunction | Promise<void>;

function createEffect(setEffects: (state: State, cb: Callable) => void) {
  return hook(
    class extends Hook {
      callback!: Effect;
      lastValues?: readonly unknown[];
      values?: readonly unknown[];
      _teardown!: Promise<void> | VoidFunction | void;

      constructor(
        id: number,
        state: State,
        ignored1: Effect,
        ignored2?: readonly unknown[]
      ) {
        super(id, state);
        setEffects(state, this);
      }

      update(callback: Effect, values?: readonly unknown[]): void {
        this.callback = callback;
        this.values = values;
      }

      call(): void {
        const hasChanged = !this.values || this.hasChanged();
        this.lastValues = this.values;

        if (hasChanged) {
          this.run();
        }
      }

      run(): void {
        this.teardown();
        this._teardown = this.callback.call(this.state);
      }

      teardown(disconnected?: boolean): void {
        if (typeof this._teardown === "function") {
          this._teardown();
          // ensure effect is not torn down multiple times
          this._teardown = undefined;
        }

        // reset to pristine state when element is disconnected
        if (disconnected) {
          this.lastValues = this.values = undefined;
        }
      }

      hasChanged(): boolean {
        return (
          !this.lastValues ||
          this.values!.some((value, i) => this.lastValues![i] !== value)
        );
      }
    }
  );
}

export { createEffect };
