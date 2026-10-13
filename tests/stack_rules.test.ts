import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dissolves } from '../src/stack_rules.js';

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
