import type { Box } from './corners.js';

export type Curve = 'ease-out-cubic' | 'ease-out-expo';

export function parse_curve(s: string): Curve {
    return s === 'ease-out-expo' ? 'ease-out-expo' : 'ease-out-cubic';
}

/** Eased progress in [0, 1] for linear progress t (clamped). Matches Clutter's modes. */
export function curve_value(curve: Curve, t: number): number {
    const x = Math.min(1, Math.max(0, t));
    if (curve === 'ease-out-expo') return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    return 1 - Math.pow(1 - x, 3);
}

export interface Transform {
    translation_x: number;
    translation_y: number;
    scale_x: number;
    scale_y: number;
}

export const IDENTITY: Readonly<Transform> = { translation_x: 0, translation_y: 0, scale_x: 1, scale_y: 1 };

/**
 * Actor transform (pivot at the actor origin; the actor spans `buffer`) that
 * makes the window's current `frame` appear exactly at `from`.
 */
export function transform_for(from: Box, frame: Box, buffer: Box): Transform {
    const scale_x = frame.width > 0 ? from.width / frame.width : 1;
    const scale_y = frame.height > 0 ? from.height / frame.height : 1;
    const fx = frame.x - buffer.x;
    const fy = frame.y - buffer.y;
    return {
        translation_x: from.x - buffer.x - scale_x * fx,
        translation_y: from.y - buffer.y - scale_y * fy,
        scale_x,
        scale_y,
    };
}

/** Where `frame` appears on screen when the actor (spanning `buffer`) has transform `t`. */
export function visual_frame(frame: Box, buffer: Box, t: Transform): Box {
    const fx = frame.x - buffer.x;
    const fy = frame.y - buffer.y;
    return {
        x: buffer.x + t.translation_x + t.scale_x * fx,
        y: buffer.y + t.translation_y + t.scale_y * fy,
        width: frame.width * t.scale_x,
        height: frame.height * t.scale_y,
    };
}

/** Transform at eased progress p of an animation from `start` to identity. */
export function transform_at(start: Transform, p: number): Transform {
    const lerp = (a: number, b: number) => a + (b - a) * p;
    return {
        translation_x: lerp(start.translation_x, 0),
        translation_y: lerp(start.translation_y, 0),
        scale_x: lerp(start.scale_x, 1),
        scale_y: lerp(start.scale_y, 1),
    };
}

export function is_identity(t: Transform): boolean {
    return (
        Math.abs(t.translation_x) < 0.5 &&
        Math.abs(t.translation_y) < 0.5 &&
        Math.abs(t.scale_x - 1) < 0.001 &&
        Math.abs(t.scale_y - 1) < 0.001
    );
}

/** Plain copy of a rectangle. Spreading does not work: yatm's Rectangle keeps its values behind getters. */
export function copy_box(r: Box): Box {
    return { x: r.x, y: r.y, width: r.width, height: r.height };
}

/** The client has committed the requested geometry (within 1 px). */
export function frame_reached(frame: Box, target: Box): boolean {
    return (
        Math.abs(frame.x - target.x) <= 1 &&
        Math.abs(frame.y - target.y) <= 1 &&
        Math.abs(frame.width - target.width) <= 1 &&
        Math.abs(frame.height - target.height) <= 1
    );
}

/** Brightness offset for a window: negative dims, 0 means no effect at all. */
export function dim_level(w: { enabled: boolean; amount: number; tiled: boolean; focused: boolean; fullscreen: boolean }): number {
    if (!w.enabled || !w.tiled || w.focused || w.fullscreen) return 0;
    return -Math.min(0.9, Math.max(0, w.amount / 100));
}

/** GNOME passes its default duration for keyboard switches; gestures compute their own. */
export function should_retime_switch(duration: number | undefined, gnome_default: number): boolean {
    return duration === gnome_default;
}
