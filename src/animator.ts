import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';

import {
    IDENTITY, copy_box, curve_value, frame_reached, is_identity, transform_at, transform_for, visual_frame,
    type Curve, type Transform,
} from './anim_math.js';

export interface AnimConfig {
    motion(): boolean;
    open(): boolean;
    duration(): number;
    curve(): Curve;
}

interface Running {
    start: Transform;
    started: number;
    duration: number;
    curve: Curve;
}

interface Pending {
    from: Rectangular;
    target: Rectangular;
    timeout: number;
    signals: number[];
}

/** Longest wait for the client to commit the requested geometry. */
const WAIT_FOR_COMMIT_MS = 100;
/** Windows marked as opening are revealed after this even if never placed. */
const REVEAL_FALLBACK_MS = 1000;
const OPEN_SCALE = 0.9;

const MODES: Record<Curve, number> = {
    'ease-out-cubic': Clutter.AnimationMode.EASE_OUT_CUBIC,
    'ease-out-expo': Clutter.AnimationMode.EASE_OUT_EXPO,
};

export class WindowAnimator {
    #running = new Map<Meta.Window, Running>();
    #pending = new Map<Meta.Window, Pending>();
    #opening = new Map<Meta.Window, number>();
    #config: AnimConfig;
    #on_done: (meta: Meta.Window) => void;

    constructor(config: AnimConfig, on_done: (meta: Meta.Window) => void) {
        this.#config = config;
        this.#on_done = on_done;
    }

    is_animating(meta: Meta.Window): boolean {
        return this.#running.has(meta) || this.#pending.has(meta);
    }

    /** Call right before yatm applies `target` to the window with move_resize_frame. */
    before_move(meta: Meta.Window, target: Rectangular): void {
        const opening = this.#opening.has(meta);
        if (!opening && !this.#config.motion()) {
            this.cancel(meta);
            return;
        }

        const from = this.#visual_now(meta);
        // Freeze the window where it is seen (no reset): resetting would flash it at
        // its old target until the client commits the new geometry.
        this.#stop(meta, false);

        const pending: Pending = { from, target: copy_box(target), timeout: 0, signals: [] };
        const check = () => {
            if (frame_reached(meta.get_frame_rect(), pending.target)) this.#start(meta, pending);
            else if (!this.#opening.has(meta)) this.#hold(meta, pending.from);
        };
        pending.signals.push(meta.connect('size-changed', check), meta.connect('position-changed', check));
        pending.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, WAIT_FOR_COMMIT_MS, () => {
            pending.timeout = 0;
            this.#start(meta, pending);
            return GLib.SOURCE_REMOVE;
        });
        this.#pending.set(meta, pending);
    }

    /** New window that yatm will place: keep it invisible until it is revealed. */
    mark_opening(meta: Meta.Window): void {
        if (!this.#config.open()) return;
        const actor: any = meta.get_compositor_private();
        if (!actor) return;

        actor.opacity = 0;
        const fallback = GLib.timeout_add(GLib.PRIORITY_DEFAULT, REVEAL_FALLBACK_MS, () => {
            if (this.#opening.get(meta) === fallback) this.#opening.delete(meta);
            this.reveal(meta);
            return GLib.SOURCE_REMOVE;
        });
        this.#opening.set(meta, fallback);
    }

    /** Scale + fade a (possibly hidden) window in at its current place. */
    reveal(meta: Meta.Window): void {
        const fallback = this.#opening.get(meta);
        if (fallback !== undefined) {
            GLib.source_remove(fallback);
            this.#opening.delete(meta);
        }

        const actor: any = meta.get_compositor_private();
        if (!actor) return;
        if (actor.opacity === 255 && fallback === undefined) return;

        if (!this.#config.open()) {
            actor.opacity = 255;
            return;
        }

        actor.remove_all_transitions();
        this.#reset(actor);
        actor.set_pivot_point(0.5, 0.5);
        actor.scale_x = OPEN_SCALE;
        actor.scale_y = OPEN_SCALE;
        actor.opacity = 0;
        actor.ease({
            opacity: 255,
            scale_x: 1,
            scale_y: 1,
            duration: this.#config.duration(),
            mode: MODES[this.#config.curve()],
            onStopped: () => this.#reset(actor),
        });
    }

    /** Stop any animation of this window and leave it at its real place. */
    cancel(meta: Meta.Window): void {
        this.#stop(meta);
        const fallback = this.#opening.get(meta);
        if (fallback !== undefined) {
            GLib.source_remove(fallback);
            this.#opening.delete(meta);
        }
        const actor: any = meta.get_compositor_private();
        if (actor) this.#reset(actor);
    }

    cancel_all(): void {
        const all = new Set<Meta.Window>([...this.#running.keys(), ...this.#pending.keys(), ...this.#opening.keys()]);
        for (const meta of all) this.cancel(meta);
    }

    #visual_now(meta: Meta.Window): Rectangular {
        const pending = this.#pending.get(meta);
        if (pending) return pending.from;

        const frame = meta.get_frame_rect();
        const run = this.#running.get(meta);
        if (!run) return frame;

        const elapsed = GLib.get_monotonic_time() / 1000 - run.started;
        const now = transform_at(run.start, curve_value(run.curve, elapsed / run.duration));
        return visual_frame(frame, meta.get_buffer_rect(), now);
    }

    #start(meta: Meta.Window, pending: Pending): void {
        if (this.#pending.get(meta) !== pending) return;
        this.#clear_pending(meta, pending);

        if (this.#opening.has(meta)) {
            this.reveal(meta);
            return;
        }

        const actor: any = meta.get_compositor_private();
        if (!actor) return;

        const start = transform_for(pending.from, meta.get_frame_rect(), meta.get_buffer_rect());
        if (is_identity(start)) {
            this.#reset(actor);
            this.#on_done(meta);
            return;
        }

        const duration = this.#config.duration();
        const curve = this.#config.curve();
        actor.set_pivot_point(0, 0);
        actor.translation_x = start.translation_x;
        actor.translation_y = start.translation_y;
        actor.scale_x = start.scale_x;
        actor.scale_y = start.scale_y;

        this.#running.set(meta, { start, started: GLib.get_monotonic_time() / 1000, duration, curve });
        actor.ease({
            ...IDENTITY,
            duration,
            mode: MODES[curve],
            onStopped: (finished: boolean) => {
                this.#running.delete(meta);
                if (finished) {
                    this.#reset(actor);
                    this.#on_done(meta);
                }
            },
        });
    }

    /**
     * While the client is still catching up (Mutter often applies the new position
     * a few frames before the new size), keep the window painted at `from`.
     */
    #hold(meta: Meta.Window, from: Rectangular): void {
        const actor: any = meta.get_compositor_private();
        if (!actor) return;
        const t = transform_for(from, meta.get_frame_rect(), meta.get_buffer_rect());
        actor.set_pivot_point(0, 0);
        actor.translation_x = t.translation_x;
        actor.translation_y = t.translation_y;
        actor.scale_x = t.scale_x;
        actor.scale_y = t.scale_y;
    }

    #stop(meta: Meta.Window, reset: boolean = true): void {
        const pending = this.#pending.get(meta);
        if (pending) this.#clear_pending(meta, pending);

        if (this.#running.delete(meta)) {
            const actor: any = meta.get_compositor_private();
            if (actor) {
                actor.remove_all_transitions();
                if (reset) this.#reset(actor);
            }
        }
    }

    #clear_pending(meta: Meta.Window, pending: Pending): void {
        for (const id of pending.signals) meta.disconnect(id);
        if (pending.timeout) GLib.source_remove(pending.timeout);
        this.#pending.delete(meta);
    }

    #reset(actor: any): void {
        actor.set_pivot_point(0, 0);
        actor.translation_x = 0;
        actor.translation_y = 0;
        actor.scale_x = 1;
        actor.scale_y = 1;
        actor.opacity = 255;
    }
}
