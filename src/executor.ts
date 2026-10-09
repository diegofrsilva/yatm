import * as Ecs from './ecs.js';
import GLib from 'gi://GLib';
import { EventQueue } from './event_queue.js';
import * as log from './log.js';

export interface Executor<T> {
    wake<S extends Ecs.System<T>>(system: S, event: T): void;
    clear(): void;
}

/** Glib-based event executor */
export class GLibExecutor<T> implements Executor<T> {
    #queue = new EventQueue<T>(
        (step) => {
            GLib.idle_add(GLib.PRIORITY_DEFAULT, step);
        },
        (error) => log.report(error, 'event loop'),
    );

    wake<S extends Ecs.System<T>>(system: S, event: T): void {
        this.#queue.wake((e) => system.run(e), event);
    }

    clear(): void {
        this.#queue.clear();
    }
}

export class OnceExecutor<X, T extends Iterable<X>> {
    #iterable: T;
    #signal: SignalID | null = null;

    constructor(iterable: T) {
        this.#iterable = iterable;
    }

    start(delay: number, apply: (v: X) => boolean, then?: () => void) {
        this.stop();

        const iterator = this.#iterable[Symbol.iterator]();

        this.#signal = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
            const next: X = iterator.next().value;

            if (typeof next === 'undefined') {
                if (then)
                    GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
                        then();
                        return false;
                    });

                return false;
            }

            return apply(next);
        });
    }

    stop() {
        if (this.#signal !== null) GLib.source_remove(this.#signal);
    }
}

export class ChannelExecutor<X> {
    #channel: Array<X> = new Array();

    #signal: null | number = null;

    clear() {
        this.#channel.splice(0);
    }

    get length(): number {
        return this.#channel.length;
    }

    send(v: X) {
        this.#channel.push(v);
    }

    start(delay: number, apply: (v: X) => boolean) {
        this.stop();

        this.#signal = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
            const e = this.#channel.shift();

            return typeof e === 'undefined' ? true : apply(e);
        });
    }

    stop() {
        if (this.#signal !== null) GLib.source_remove(this.#signal);
    }
}
