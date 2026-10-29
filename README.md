# ts-hunt-mcilroy-diff

Produces a line-level diff between two text documents by finding the longest common subsequence of lines.

```js
import { diff } from 'ts-hunt-mcilroy-diff';

const ops = diff('apple\nbanana\ncherry', 'apple\ndate\ncherry');
for (const op of ops) {
  if (op.type === 'common') console.log(`  ${op.line}`);
  if (op.type === 'delete') console.log(`- ${op.line}`);
  if (op.type === 'insert') console.log(`+ ${op.line}`);
}
```

The library exists to provide a dependency-free, predictable line diff. The trade-off is simplicity over performance: the classic dynamic-programming LCS uses O(n*m) time and space, which is fine for typical source files but will not scale to documents with hundreds of thousands of lines. If you need that, use a Myers-based library instead.

The `diff` function returns an array of `{ type, line, oldLine, newLine }` objects where `type` is `'common'`, `'delete'`, or `'insert'`. The `oldLine` and `newLine` fields are 1-based line numbers, or `-1` when the op does not touch that document. Concatenating the `line` fields of all non-`insert` ops reconstructs the old text; all non-`delete` ops reconstruct the new text.

The awkward edge: a trailing newline on the input does not create a phantom empty final line. `"a\n"` is treated as one line (`["a"]`), matching how most editors count lines. If your document genuinely ends with a blank line, represent it as `"a\n\n"`.
