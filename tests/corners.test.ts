import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corner_bounds, window_corner_radius, stack_tab_radius } from '../src/corners.js';

test('server-side decorated window: bounds cover the whole actor', () => {
    const r = { x: 100, y: 50, width: 640, height: 480 };
    assert.deepEqual(corner_bounds(r, r), { x1: 0, y1: 0, x2: 640, y2: 480 });
});

test('client-side shadow: bounds are the frame inside the larger buffer', () => {
    const frame = { x: 100, y: 50, width: 640, height: 480 };
    const buffer = { x: 76, y: 30, width: 688, height: 528 };
    assert.deepEqual(corner_bounds(frame, buffer), { x1: 24, y1: 20, x2: 664, y2: 500 });
});

const base = { tiled: true, enabled: true, radius: 8, maximized: false, fullscreen: false, destroying: false, stacked: false };

test('tiled window gets the configured radius', () => {
    assert.deepEqual(window_corner_radius(base), { top: 8, bottom: 8 });
});

test('maximized or fullscreen windows are square (and skip the offscreen effect)', () => {
    assert.deepEqual(window_corner_radius({ ...base, maximized: true }), { top: 0, bottom: 0 });
    assert.deepEqual(window_corner_radius({ ...base, fullscreen: true }), { top: 0, bottom: 0 });
});

test('floating windows and the toggle off are square', () => {
    assert.deepEqual(window_corner_radius({ ...base, tiled: false }), { top: 0, bottom: 0 });
    assert.deepEqual(window_corner_radius({ ...base, enabled: false }), { top: 0, bottom: 0 });
});

test('closing windows are left untouched', () => {
    assert.equal(window_corner_radius({ ...base, destroying: true }), null);
});

test('stacked windows are square at the top, where they meet the tab bar', () => {
    assert.deepEqual(window_corner_radius({ ...base, stacked: true }), { top: 0, bottom: 8 });
});

test('stack tabs: only the first tab rounds its top-left corner (the bar rounds the rest)', () => {
    assert.equal(stack_tab_radius(0, 3, 15), '15px 0px 0px 0px');
    assert.equal(stack_tab_radius(1, 3, 15), '0px');
    assert.equal(stack_tab_radius(2, 3, 15), '0px');
    assert.equal(stack_tab_radius(0, 1, 15), '15px 0px 0px 0px');
});

test('stack tab radius never exceeds half the tab bar height', () => {
    assert.equal(stack_tab_radius(0, 2, 40, 32), '16px 0px 0px 0px');
});
