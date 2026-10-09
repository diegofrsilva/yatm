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

/**
 * Corner radius a window should have: the configured radius only for tiled,
 * non-maximized, non-fullscreen windows (square windows skip the offscreen
 * effect entirely). null = leave the window alone (it is closing).
 */
export function window_corner_radius(w: {
    tiled: boolean;
    enabled: boolean;
    radius: number;
    maximized: boolean;
    fullscreen: boolean;
    destroying: boolean;
}): number | null {
    if (w.destroying) return null;
    if (!w.tiled || !w.enabled || w.maximized || w.fullscreen) return 0;
    return w.radius;
}
