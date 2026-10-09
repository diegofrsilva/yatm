import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corner_bounds } from '../src/corners.js';

test('server-side decorated window: bounds cover the whole actor', () => {
    const r = { x: 100, y: 50, width: 640, height: 480 };
    assert.deepEqual(corner_bounds(r, r), { x1: 0, y1: 0, x2: 640, y2: 480 });
});

test('client-side shadow: bounds are the frame inside the larger buffer', () => {
    const frame = { x: 100, y: 50, width: 640, height: 480 };
    const buffer = { x: 76, y: 30, width: 688, height: 528 };
    assert.deepEqual(corner_bounds(frame, buffer), { x1: 24, y1: 20, x2: 664, y2: 500 });
});
