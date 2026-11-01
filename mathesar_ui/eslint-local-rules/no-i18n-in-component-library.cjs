/**
 * ESLint rule to prevent use of svelte-i18n in component-library components
 *
 * This rule ensures that components within '/src/component-library' directory
 * do not use svelte-i18n translations, as they should be reusable components
 * without translation dependencies.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent use of svelte-i18n in component-library components',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noI18nImport:
        'Components in component-library should not use svelte-i18n. Remove the import from svelte-i18n.',
      noI18nUsage:
        'Components in component-library should not use svelte-i18n translation functions like $_() or get(_).',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only apply this rule to files in component-library
    if (!filename.includes('/component-library/')) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        // Check for imports from svelte-i18n
        if (node.source.value === 'svelte-i18n') {
          context.report({
            node,
            messageId: 'noI18nImport',
          });
        }
      },

      CallExpression(node) {
        // Check for $_() calls
        if (node.callee.type === 'Identifier' && node.callee.name === '$_') {
          context.report({
            node,
            messageId: 'noI18nUsage',
          });
        }

        // Check for get(_)() calls
        if (
          node.callee.type === 'CallExpression' &&
          node.callee.callee.type === 'Identifier' &&
          node.callee.callee.name === 'get' &&
          node.callee.arguments.length === 1 &&
          node.callee.arguments[0].type === 'Identifier' &&
          node.callee.arguments[0].name === '_'
        ) {
          context.report({
            node,
            messageId: 'noI18nUsage',
          });
        }
      },
    };
  },
};
