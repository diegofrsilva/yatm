import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dissolves, stack_window_area } from '../src/stack_rules.js';

test('a stack left with one window after holding several turns back into a tile', () => {
    assert.equal(dissolves(1, true), true);
});

test('a stack just created on a single window stays, so windows can be added to it', () => {
    assert.equal(dissolves(1, false), false);
});

test('stacks with several windows stay', () => {
    assert.equal(dissolves(2, true), false);
    assert.equal(dissolves(3, true), false);
});

test('a stack reserves exactly its tab bar height above its windows', () => {
    const area = { x: 0, y: 32, width: 1920, height: 1048 };
    assert.deepEqual(stack_window_area(area, 32), { x: 0, y: 64, width: 1920, height: 1016 });
    assert.deepEqual(stack_window_area(area, 64), { x: 0, y: 96, width: 1920, height: 984 });
});
