/**
 * Core Hunt-McIlroy diff implementation.
 *
 * The algorithm finds the longest common subsequence (LCS) of lines
 * between two documents and reports every line as either common,
 * deleted from the old document, or inserted into the new document.
 *
 * We use the classic dynamic-programming LCS table (O(n*m) time and
 * space). For a small line-level diff library this is the simplest
 * correct choice and is easy to reason about; the quadratic cost only
 * bites on very large inputs, which are out of scope here.
 */

/**
 * @typedef {Object} DiffOp
 * @property {'common'|'delete'|'insert'} type
 * @property {string} line           The text of the line (no trailing newline).
 * @property {number} oldLine         1-based line number in the old document, or -1 when N/A.
 * @property {number} newLine         1-based line number in the new document, or -1 when N/A.
 */

/**
 * Split text into lines without trailing newline characters.
 *
 * We split on \n. If the text ends with a newline the final empty
 * segment is dropped, so "a\n" -> ["a"] and "a\nb" -> ["a","b"].
 * An empty string yields an empty array. This keeps line numbers
 * stable and avoids a phantom trailing line.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitLines(text) {
  if (text === '') return [];
  const parts = text.split('\n');
  if (parts.length > 0 && parts[parts.length - 1] === '') {
    parts.pop();
  }
  return parts;
}

/**
 * Build the DP table for the LCS of two line arrays.
 *
 * table[i][j] = length of the LCS of oldLines[0..i) and newLines[0..j).
 * Dimensions are (a+1) x (b+1) so the base case (empty prefix) is row/column 0.
 *
 * @param {string[]} oldLines
 * @param {string[]} newLines
 * @returns {number[][]}
 */
function buildLcsTable(oldLines, newLines) {
  const a = oldLines.length;
  const b = newLines.length;
  const table = new Array(a + 1);
  for (let i = 0; i <= a; i++) {
    table[i] = new Array(b + 1).fill(0);
  }
  for (let i = 1; i <= a; i++) {
    for (let j = 1; j <= b; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }
  return table;
}

/**
 * Walk the DP table backwards to produce a list of DiffOps.
 *
 * Starting from table[a][b], when the two current lines match we emit
 * a 'common' op and step diagonally; otherwise we step in the
 * direction of the larger LCS value, emitting 'delete' (old line
 * consumed) or 'insert' (new line consumed). The result is reversed
 * at the end so ops are in document order.
 *
 * @param {number[][]} table
 * @param {string[]} oldLines
 * @param {string[]} newLines
 * @returns {DiffOp[]}
 */
function backtrack(table, oldLines, newLines) {
  const ops = [];
  let i = oldLines.length;
  let j = newLines.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ type: 'common', line: oldLines[i - 1], oldLine: i, newLine: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
      ops.push({ type: 'insert', line: newLines[j - 1], oldLine: -1, newLine: j });
      j--;
    } else {
      ops.push({ type: 'delete', line: oldLines[i - 1], oldLine: i, newLine: -1 });
      i--;
    }
  }
  ops.reverse();
  return ops;
}

/**
 * Compute a line-level diff between two text documents.
 *
 * Each input is treated as plain text and split on newlines. The
 * return value is an ordered list of DiffOp objects whose `line`
 * fields, concatenated with '\n', reconstruct the new document when
 * 'delete' ops are skipped and the old document when 'insert' ops are
 * skipped.
 *
 * @param {string} oldText
 * @param {string} newText
 * @returns {DiffOp[]}
 */
export function diff(oldText, newText) {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const table = buildLcsTable(oldLines, newLines);
  return backtrack(table, oldLines, newLines);
}
