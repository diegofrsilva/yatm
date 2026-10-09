import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restart_tiler_steps, type TilerControl } from '../src/panic.js';
import { run_steps } from '../src/guard.js';

function tiler(opts: { running: boolean; by_default: boolean; stop_throws?: boolean }) {
    const calls: string[] = [];
    let running = opts.running;
    const t: TilerControl = {
        running: () => running,
        enabled_by_default: () => opts.by_default,
        stop: () => { calls.push('stop'); if (opts.stop_throws) throw new Error('corrupt forest'); running = false; },
        forget: () => { calls.push('forget'); running = false; },
        start: () => { calls.push('start'); running = true; },
    };
    return { t, calls };
}

test('restarts a running tiler', () => {
    const { t, calls } = tiler({ running: true, by_default: true });
    run_steps('panic', restart_tiler_steps(t), () => {});
    assert.deepEqual(calls, ['stop', 'forget', 'start']);
});

test('still starts tiling when stopping the old tiler throws', () => {
    const { t, calls } = tiler({ running: true, by_default: true, stop_throws: true });
    const errors: string[] = [];
    run_steps('panic', restart_tiler_steps(t), (_e, ctx) => errors.push(ctx));
    assert.deepEqual(calls, ['stop', 'forget', 'start']);
    assert.deepEqual(errors, ['panic: stop tiler']);
});

test('starts tiling when the tiler was lost but tiling is on by default', () => {
    const { t, calls } = tiler({ running: false, by_default: true });
    run_steps('panic', restart_tiler_steps(t), () => {});
    assert.deepEqual(calls, ['forget', 'start']);
});

test('leaves tiling off when it was off', () => {
    const { t, calls } = tiler({ running: false, by_default: false });
    run_steps('panic', restart_tiler_steps(t), () => {});
    assert.deepEqual(calls, ['forget']);
});
