import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corner_bounds, window_corner_radius } from '../src/corners.js';

test('server-side decorated window: bounds cover the whole actor', () => {
    const r = { x: 100, y: 50, width: 640, height: 480 };
    assert.deepEqual(corner_bounds(r, r), { x1: 0, y1: 0, x2: 640, y2: 480 });
});

test('client-side shadow: bounds are the frame inside the larger buffer', () => {
    const frame = { x: 100, y: 50, width: 640, height: 480 };
    const buffer = { x: 76, y: 30, width: 688, height: 528 };
    assert.deepEqual(corner_bounds(frame, buffer), { x1: 24, y1: 20, x2: 664, y2: 500 });
});

const base = { tiled: true, enabled: true, radius: 8, maximized: false, fullscreen: false, destroying: false };

test('tiled window gets the configured radius', () => {
    assert.equal(window_corner_radius(base), 8);
});

test('maximized or fullscreen windows are square (and skip the offscreen effect)', () => {
    assert.equal(window_corner_radius({ ...base, maximized: true }), 0);
    assert.equal(window_corner_radius({ ...base, fullscreen: true }), 0);
});

test('floating windows and the toggle off are square', () => {
    assert.equal(window_corner_radius({ ...base, tiled: false }), 0);
    assert.equal(window_corner_radius({ ...base, enabled: false }), 0);
});

test('closing windows are left untouched', () => {
    assert.equal(window_corner_radius({ ...base, destroying: true }), null);
});
