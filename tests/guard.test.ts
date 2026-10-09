import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guard, run_steps } from '../src/guard.js';

test('passes arguments and return value through', () => {
    const add = guard('add', (a: number, b: number) => a + b, () => assert.fail('no error expected'));
    assert.equal(add(2, 3), 5);
});

test('reports the error with context and runs cleanup', () => {
    const reported: string[] = [];
    let cleaned = false;
    const f = guard('grab-op-end', () => { throw new Error('boom'); },
        (_e, ctx) => reported.push(ctx), () => { cleaned = true; });
    assert.equal(f(), undefined);
    assert.deepEqual(reported, ['grab-op-end']);
    assert.equal(cleaned, true);
});

test('a throwing cleanup is reported too, never rethrown', () => {
    const reported: string[] = [];
    const f = guard('drag', () => { throw new Error('a'); },
        (_e, ctx) => reported.push(ctx), () => { throw new Error('b'); });
    assert.doesNotThrow(() => f());
    assert.deepEqual(reported, ['drag', 'drag (cleanup)']);
});

test('run_steps runs every step even when earlier ones throw', () => {
    const ran: string[] = [];
    const reported: string[] = [];
    run_steps('panic', [
        ['a', () => { ran.push('a'); }],
        ['b', () => { throw new Error('b'); }],
        ['c', () => { ran.push('c'); }],
    ], (_e, ctx) => reported.push(ctx));
    assert.deepEqual(ran, ['a', 'c']);
    assert.deepEqual(reported, ['panic: b']);
});
