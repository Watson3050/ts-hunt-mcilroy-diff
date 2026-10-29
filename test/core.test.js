import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diff, splitLines } from '../src/index.js';

test('splitLines: empty string yields empty array', () => {
  assert.deepEqual(splitLines(''), []);
});

test('splitLines: single line no newline', () => {
  assert.deepEqual(splitLines('abc'), ['abc']);
});

test('splitLines: trailing newline does not create phantom empty line', () => {
  assert.deepEqual(splitLines('a\n'), ['a']);
  assert.deepEqual(splitLines('a\nb\n'), ['a', 'b']);
});

test('splitLines: internal blank lines preserved', () => {
  assert.deepEqual(splitLines('a\n\nb'), ['a', '', 'b']);
});

test('diff: identical documents produce all common ops', () => {
  const ops = diff('a\nb\nc', 'a\nb\nc');
  assert.equal(ops.length, 3);
  assert.deepEqual(ops, [
    { type: 'common', line: 'a', oldLine: 1, newLine: 1 },
    { type: 'common', line: 'b', oldLine: 2, newLine: 2 },
    { type: 'common', line: 'c', oldLine: 3, newLine: 3 },
  ]);
});

test('diff: empty old document is all inserts', () => {
  const ops = diff('', 'x\ny');
  assert.equal(ops.length, 2);
  assert.deepEqual(ops, [
    { type: 'insert', line: 'x', oldLine: -1, newLine: 1 },
    { type: 'insert', line: 'y', oldLine: -1, newLine: 2 },
  ]);
});

test('diff: empty new document is all deletes', () => {
  const ops = diff('x\ny', '');
  assert.deepEqual(ops, [
    { type: 'delete', line: 'x', oldLine: 1, newLine: -1 },
    { type: 'delete', line: 'y', oldLine: 2, newLine: -1 },
  ]);
});

test('diff: pure insertion in the middle', () => {
  const ops = diff('a\nc', 'a\nb\nc');
  assert.deepEqual(ops, [
    { type: 'common', line: 'a', oldLine: 1, newLine: 1 },
    { type: 'insert', line: 'b', oldLine: -1, newLine: 2 },
    { type: 'common', line: 'c', oldLine: 2, newLine: 3 },
  ]);
});

test('diff: pure deletion in the middle', () => {
  const ops = diff('a\nb\nc', 'a\nc');
  assert.deepEqual(ops, [
    { type: 'common', line: 'a', oldLine: 1, newLine: 1 },
    { type: 'delete', line: 'b', oldLine: 2, newLine: -1 },
    { type: 'common', line: 'c', oldLine: 3, newLine: 2 },
  ]);
});

test('diff: full replacement', () => {
  const ops = diff('one\ntwo', 'three\nfour');
  assert.deepEqual(ops, [
    { type: 'delete', line: 'one', oldLine: 1, newLine: -1 },
    { type: 'delete', line: 'two', oldLine: 2, newLine: -1 },
    { type: 'insert', line: 'three', oldLine: -1, newLine: 1 },
    { type: 'insert', line: 'four', oldLine: -1, newLine: 2 },
  ]);
});

test('diff: ops reconstruct old document when inserts skipped', () => {
  const ops = diff('a\nb\nc\nd', 'a\nc\ne');
  const oldReconstructed = ops
    .filter((o) => o.type !== 'insert')
    .map((o) => o.line)
    .join('\n');
  assert.equal(oldReconstructed, 'a\nb\nc\nd');
});

test('diff: ops reconstruct new document when deletes skipped', () => {
  const ops = diff('a\nb\nc\nd', 'a\nc\ne');
  const newReconstructed = ops
    .filter((o) => o.type !== 'delete')
    .map((o) => o.line)
    .join('\n');
  assert.equal(newReconstructed, 'a\nc\ne');
});

test('diff: line numbers are 1-based and -1 when not applicable', () => {
  const ops = diff('keep\nold', 'keep\nnew');
  assert.deepEqual(ops, [
    { type: 'common', line: 'keep', oldLine: 1, newLine: 1 },
    { type: 'delete', line: 'old', oldLine: 2, newLine: -1 },
    { type: 'insert', line: 'new', oldLine: -1, newLine: 2 },
  ]);
});

test('diff: duplicate lines are matched greedily by the LCS', () => {
  const ops = diff('x\nx\ny', 'x\ny\ny');
  const oldReconstructed = ops.filter((o) => o.type !== 'insert').map((o) => o.line).join('\n');
  const newReconstructed = ops.filter((o) => o.type !== 'delete').map((o) => o.line).join('\n');
  assert.equal(oldReconstructed, 'x\nx\ny');
  assert.equal(newReconstructed, 'x\ny\ny');
});
