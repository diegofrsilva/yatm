/** A scheduled unit of work; return true to be called again. */
export type Step = () => boolean;

/**
 * FIFO event queue processed one event per scheduled step.
 *
 * An event handler that throws is reported through `on_error` and the queue
 * keeps going. (Upstream's GLibExecutor left its loop marked as running when a
 * handler threw, so no event ever ran again — the "everything froze" bug.)
 */
export class EventQueue<T> {
    #events: Array<T> = new Array();
    #running = false;
    #schedule: (step: Step) => void;
    #on_error: (error: unknown) => void;

    constructor(schedule: (step: Step) => void, on_error: (error: unknown) => void) {
        this.#schedule = schedule;
        this.#on_error = on_error;
    }

    get pending(): number {
        return this.#events.length;
    }

    wake(run: (event: T) => void, event: T): void {
        this.#events.push(event);

        if (this.#running) return;
        this.#running = true;

        this.#schedule(() => {
            const next = this.#events.shift();
            if (next !== undefined) {
                try {
                    run(next);
                } catch (error) {
                    this.#on_error(error);
                }
            }

            if (this.#events.length === 0) {
                this.#running = false;
                return false;
            }

            return true;
        });
    }

    clear(): void {
        this.#events.length = 0;
    }
}
