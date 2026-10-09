import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valid_monitor } from '../src/monitors.js';

test('index inside the monitor list is valid', () => {
    assert.equal(valid_monitor(0, 1), true);
    assert.equal(valid_monitor(1, 2), true);
});

test('no monitors yet (shell startup): nothing is valid', () => {
    assert.equal(valid_monitor(0, 0), false);
});

test('negative or out-of-range index is invalid', () => {
    assert.equal(valid_monitor(-1, 2), false);
    assert.equal(valid_monitor(2, 2), false);
});
