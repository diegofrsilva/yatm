export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CornerBounds {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

/**
 * The window frame in coordinates local to the window actor, which spans the
 * buffer rect (frame + client-side shadow). Corners are clipped to these bounds.
 */
export function corner_bounds(frame: Box, buffer: Box): CornerBounds {
    const x1 = frame.x - buffer.x;
    const y1 = frame.y - buffer.y;
    return { x1, y1, x2: x1 + frame.width, y2: y1 + frame.height };
}

export interface CornerRadii {
    top: number;
    bottom: number;
}

/**
 * Corner radii a window should have: the configured radius only for tiled,
 * non-maximized, non-fullscreen windows (square windows skip the offscreen
 * effect entirely). Stacked windows are square at the top, where they meet the
 * tab bar. null = leave the window alone (it is closing).
 */
export function window_corner_radius(w: {
    tiled: boolean;
    enabled: boolean;
    radius: number;
    maximized: boolean;
    fullscreen: boolean;
    destroying: boolean;
    stacked: boolean;
}): CornerRadii | null {
    if (w.destroying) return null;
    if (!w.tiled || !w.enabled || w.maximized || w.fullscreen) return { top: 0, bottom: 0 };
    return { top: w.stacked ? 0 : w.radius, bottom: w.radius };
}

/**
 * CSS border-radius of a stack tab. The tab bar itself rounds its top corners;
 * only the first tab paints over the top-left one, so only it needs rounding.
 */
export function stack_tab_radius(idx: number, _count: number, radius: number, tab_height: number = Infinity): string {
    const r = Math.max(0, Math.min(radius, Math.trunc(tab_height / 2)));
    return idx === 0 ? `${r}px 0px 0px 0px` : '0px';
}
