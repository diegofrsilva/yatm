import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import Cogl from 'gi://Cogl';

import { corner_bounds, type CornerBounds } from './corners.js';

const EFFECT_NAME = 'yatm-rounded-corners';

// Coverage of a rounded rect with anti-aliased corners; 0 outside the frame
// (which also drops client-side shadows of tiled windows).
const DECLARATIONS = `
uniform vec4 bounds;
uniform float clip_radius;
uniform vec2 pixel_step;

float yatm_corner_alpha(vec2 p) {
    if (p.x < bounds.x || p.x > bounds.z || p.y < bounds.y || p.y > bounds.w) return 0.0;

    vec2 center;
    if (p.x < bounds.x + clip_radius) center.x = bounds.x + clip_radius;
    else if (p.x > bounds.z - clip_radius) center.x = bounds.z - clip_radius;
    else return 1.0;

    if (p.y < bounds.y + clip_radius) center.y = bounds.y + clip_radius;
    else if (p.y > bounds.w - clip_radius) center.y = bounds.w - clip_radius;
    else return 1.0;

    return clamp(clip_radius - distance(p, center) + 0.5, 0.0, 1.0);
}
`;

const CODE = `
    vec2 p = cogl_tex_coord0_in.xy / pixel_step;
    cogl_color_out *= yatm_corner_alpha(p);
`;

const RoundedCornersEffect = GObject.registerClass(
    { GTypeName: 'YatmRoundedCornersEffect' },
    class RoundedCornersEffect extends Shell.GLSLEffect {
        vfunc_build_pipeline() {
            this.add_glsl_snippet(Cogl.SnippetHook.FRAGMENT, DECLARATIONS, CODE, false);
        }

        update(b: CornerBounds, radius: number, width: number, height: number) {
            if (width <= 0 || height <= 0) return;
            this.set_uniform_float(this.get_uniform_location('bounds'), 4, [b.x1, b.y1, b.x2, b.y2]);
            this.set_uniform_float(this.get_uniform_location('clip_radius'), 1, [radius]);
            this.set_uniform_float(this.get_uniform_location('pixel_step'), 2, [1 / width, 1 / height]);
            this.queue_repaint();
        }
    },
);

/** Applies, updates or (radius <= 0) removes rounded corners on a window's actor. */
export function set_rounded_corners(meta: Meta.Window, radius: number): void {
    const actor: any = meta.get_compositor_private();
    if (!actor) return;

    let effect: any = actor.get_effect(EFFECT_NAME);

    if (radius <= 0) {
        if (effect) actor.remove_effect(effect);
        return;
    }

    if (!effect) {
        effect = new RoundedCornersEffect();
        actor.add_effect_with_name(EFFECT_NAME, effect);
    }

    const bounds = corner_bounds(meta.get_frame_rect(), meta.get_buffer_rect());
    effect.update(bounds, radius, actor.get_width(), actor.get_height());
}
