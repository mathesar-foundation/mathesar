// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no types available for eslint-plugin-promise
import promise from 'eslint-plugin-promise';
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint';

/**
 * @file This file stores our configuration for the "promise" eslint plugin and
 * its rules.
 */

export default [
  promise.configs['flat/recommended'],
] satisfies InfiniteDepthConfigWithExtends;