import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventQueue, type Step } from '../src/event_queue.js';

/** Manual scheduler: collects steps; drain() runs them like GLib idle would. */
function manual() {
    let step: Step | null = null;
    return {
        schedule: (s: Step) => {
            assert.equal(step, null, 'scheduled twice while a step is active');
            step = s;
        },
        drain() {
            while (step) {
                const again = step();
                if (!again) step = null;
            }
        },
    };
}

test('runs events in FIFO order', () => {
    const sched = manual();
    const q = new EventQueue<number>(sched.schedule, () => {});
    const seen: number[] = [];
    for (const n of [1, 2, 3]) q.wake((e) => seen.push(e), n);
    sched.drain();
    assert.deepEqual(seen, [1, 2, 3]);
});

test('a throwing event is reported and later events still run', () => {
    const sched = manual();
    const errors: unknown[] = [];
    const q = new EventQueue<number>(sched.schedule, (e) => errors.push(e));
    const seen: number[] = [];
    const run = (e: number) => {
        if (e === 2) throw new Error('boom');
        seen.push(e);
    };
    for (const n of [1, 2, 3]) q.wake(run, n);
    sched.drain();
    assert.deepEqual(seen, [1, 3]);
    assert.equal(errors.length, 1);
});

test('queue restarts after an error drained it', () => {
    const sched = manual();
    const q = new EventQueue<number>(sched.schedule, () => {});
    q.wake(() => { throw new Error('boom'); }, 1);
    sched.drain();
    const seen: number[] = [];
    q.wake((e) => seen.push(e), 2);
    sched.drain();
    assert.deepEqual(seen, [2]);
});

test('clear() drops pending events and the queue keeps working', () => {
    const sched = manual();
    const q = new EventQueue<number>(sched.schedule, () => {});
    const seen: number[] = [];
    q.wake((e) => seen.push(e), 1);
    q.wake((e) => seen.push(e), 2);
    assert.equal(q.pending, 2);
    q.clear();
    sched.drain();
    q.wake((e) => seen.push(e), 3);
    sched.drain();
    assert.deepEqual(seen, [3]);
});
