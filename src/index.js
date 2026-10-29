/**
 * Public entry point for ts-hunt-mcilroy-diff.
 *
 * Re-exports the diff function and splitLines helper from ./core.js
 * so consumers can `import { diff } from 'ts-hunt-mcilroy-diff'`.
 */
export { diff, splitLines } from './core.js';
