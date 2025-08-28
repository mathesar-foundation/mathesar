// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no types available for eslint-plugin-promise
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint';

/**
 * @file This file stores our configuration for the eslint-comments eslint
 * plugin and its rules.
 */

export default [
  comments.recommended,
] satisfies InfiniteDepthConfigWithExtends;