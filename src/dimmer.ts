import Clutter from 'gi://Clutter';

const EFFECT_NAME = 'yatm-dim';

interface DimState {
    level: number;
    timeline: any | null;
}

/** Brightness-based dimming; the effect only exists while a window is dimmed. */
export class Dimmer {
    #state = new Map<Meta.Window, DimState>();

    set_level(meta: Meta.Window, level: number, duration: number): void {
        const actor: any = meta.get_compositor_private();
        if (!actor) {
            this.#state.delete(meta);
            return;
        }

        const state = this.#state.get(meta) ?? { level: 0, timeline: null };
        if (state.timeline) {
            state.timeline.stop();
            state.timeline = null;
        }
        if (state.level === level) {
            this.#apply(actor, level);
            this.#remember(meta, state);
            return;
        }

        const from = state.level;
        if (duration <= 0) {
            state.level = level;
            this.#apply(actor, level);
            this.#remember(meta, state);
            return;
        }

        const timeline = new Clutter.Timeline({ actor, duration });
        timeline.connect('new-frame', () => {
            state.level = from + (level - from) * timeline.get_progress();
            this.#apply(actor, state.level);
        });
        timeline.connect('completed', () => {
            state.level = level;
            state.timeline = null;
            this.#apply(actor, level);
            this.#remember(meta, state);
        });
        state.timeline = timeline;
        this.#state.set(meta, state);
        timeline.start();
    }

    clear_all(): void {
        for (const [meta, state] of this.#state) {
            state.timeline?.stop();
            const actor: any = meta.get_compositor_private();
            if (actor) this.#apply(actor, 0);
        }
        this.#state.clear();
    }

    #remember(meta: Meta.Window, state: DimState): void {
        if (state.level === 0 && !state.timeline) this.#state.delete(meta);
        else this.#state.set(meta, state);
    }

    #apply(actor: any, level: number): void {
        let effect = actor.get_effect(EFFECT_NAME);
        if (level === 0) {
            if (effect) actor.remove_effect(effect);
            return;
        }
        if (!effect) {
            effect = new Clutter.BrightnessContrastEffect();
            actor.add_effect_with_name(EFFECT_NAME, effect);
        }
        effect.set_brightness(level);
    }
}
