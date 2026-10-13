import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import Cogl from 'gi://Cogl';

import { corner_bounds, type CornerBounds, type CornerRadii } from './corners.js';

type Rgba = [number, number, number, number];

/** Colors (0..1 rgba) painted under the window's transparent top corners, `size` px square. */
export interface TopFill {
    left: Rgba;
    right: Rgba;
    size: number;
}

const EFFECT_NAME = 'yatm-rounded-corners';

// Coverage of a rounded rect with anti-aliased corners; 0 outside the frame
// (which also drops client-side shadows of tiled windows).
// Coverage of a rounded rect with anti-aliased corners; 0 outside the frame
// (which also drops client-side shadows of tiled windows). radii = (top, bottom).
const DECLARATIONS = `
uniform vec4 bounds;
uniform vec2 radii;
uniform vec2 pixel_step;
uniform vec4 top_fill_left;
uniform vec4 top_fill_right;
uniform float top_fill_size;

float yatm_corner_alpha(vec2 p) {
    if (p.x < bounds.x || p.x > bounds.z || p.y < bounds.y || p.y > bounds.w) return 0.0;

    float r = p.y < (bounds.y + bounds.w) * 0.5 ? radii.x : radii.y;
    if (r <= 0.0) return 1.0;

    vec2 center;
    if (p.x < bounds.x + r) center.x = bounds.x + r;
    else if (p.x > bounds.z - r) center.x = bounds.z - r;
    else return 1.0;

    if (p.y < bounds.y + r) center.y = bounds.y + r;
    else if (p.y > bounds.w - r) center.y = bounds.w - r;
    else return 1.0;

    return clamp(r - distance(p, center) + 0.5, 0.0, 1.0);
}

// Apps (libadwaita) round their own top corners; under a stack's tab bar those
// see-through notches are filled with the bar's color right above them, so the
// join looks square.
bool yatm_in_top_fill(vec2 p) {
    return p.y >= bounds.y && p.y < bounds.y + top_fill_size &&
        (p.x < bounds.x + top_fill_size || p.x > bounds.z - top_fill_size);
}
`;

const CODE = `
    vec2 p = cogl_tex_coord0_in.xy / pixel_step;
    if (top_fill_size > 0.0 && yatm_in_top_fill(p)) {
        vec4 fill = p.x < (bounds.x + bounds.z) * 0.5 ? top_fill_left : top_fill_right;
        cogl_color_out = cogl_color_out + vec4(fill.rgb * fill.a, fill.a) * (1.0 - cogl_color_out.a);
    }
    cogl_color_out *= yatm_corner_alpha(p);
`;

const RoundedCornersEffect = GObject.registerClass(
    { GTypeName: 'YatmRoundedCornersEffect' },
    class RoundedCornersEffect extends Shell.GLSLEffect {
        vfunc_build_pipeline() {
            this.add_glsl_snippet(Cogl.SnippetHook.FRAGMENT, DECLARATIONS, CODE, false);
        }

        update(b: CornerBounds, radii: CornerRadii, fill: TopFill | null, width: number, height: number) {
            if (width <= 0 || height <= 0) return;
            this.set_uniform_float(this.get_uniform_location('bounds'), 4, [b.x1, b.y1, b.x2, b.y2]);
            this.set_uniform_float(this.get_uniform_location('radii'), 2, [radii.top, radii.bottom]);
            this.set_uniform_float(this.get_uniform_location('top_fill_left'), 4, fill ? fill.left : [0, 0, 0, 0]);
            this.set_uniform_float(this.get_uniform_location('top_fill_right'), 4, fill ? fill.right : [0, 0, 0, 0]);
            this.set_uniform_float(this.get_uniform_location('top_fill_size'), 1, [fill ? fill.size : 0]);
            this.set_uniform_float(this.get_uniform_location('pixel_step'), 2, [1 / width, 1 / height]);
            this.queue_repaint();
        }
    },
);

/** Applies, updates or (all radii 0, no fill) removes rounded corners on a window's actor. */
export function set_rounded_corners(meta: Meta.Window, radii: CornerRadii, fill: TopFill | null = null): void {
    const actor: any = meta.get_compositor_private();
    if (!actor) return;

    let effect: any = actor.get_effect(EFFECT_NAME);

    if (radii.top <= 0 && radii.bottom <= 0 && !fill) {
        if (effect) actor.remove_effect(effect);
        return;
    }

    if (!effect) {
        effect = new RoundedCornersEffect();
        actor.add_effect_with_name(EFFECT_NAME, effect);
    }

    const bounds = corner_bounds(meta.get_frame_rect(), meta.get_buffer_rect());
    effect.update(bounds, radii, fill, actor.get_width(), actor.get_height());
}
