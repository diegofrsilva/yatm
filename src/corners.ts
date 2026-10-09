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
