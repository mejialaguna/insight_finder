/* eslint-disable import/no-anonymous-default-export */
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import tsParser from '@typescript-eslint/parser';

import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: { rules: {} }, // 👈 Fix added here
});

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "eslint.config.mjs",
      "next.config.mjs",
      "postcss.config.js",
      'postcss.config.mjs',
    ], // ✅ ignore rule
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'next/core-web-vitals'
  ),

  {
    // Explicitly set parser options
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      // ✅ General Best Practices
      'no-console': 'error', // Disallow console logs
      'no-debugger': 'error', // Disallow debugger statements
      'no-alert': 'error', // Disallow alert, confirm, and prompt
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ], // Allow underscore-prefixed unused vars
      'max-len': [
        'error',
        {
          code: 120, // Reduce line length for better readability
          ignorePattern: '^\\s*//\\s*\\d+$',
          ignoreComments: true,
        },
      ],
      quotes: ['error', 'single', { avoidEscape: true }], // Prefer single quotes, allow escaping
      semi: ['error', 'always'], // Enforce semicolons

      // ✅ Ensure an Empty Line at the End of Every File
      'eol-last': ['error', 'always'],

      // ✅ TypeScript Rules
      '@typescript-eslint/no-explicit-any': 'error', // Disallow `any` type
      '@typescript-eslint/no-non-null-assertion': 'error', // Disallow `!` non-null assertions
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ], // Ignore unused args starting with `_`
      '@typescript-eslint/consistent-type-imports': 'error', // Use type-only imports when possible

      // ✅ React Rules
      'react/react-in-jsx-scope': 'off', // Not needed for Next.js
      'react/display-name': 'off', // Avoid warnings for missing display names
      'react/prop-types': 'off', // Not needed with TypeScript
      'react/self-closing-comp': 'error', // Enforce self-closing tags where possible

      // ✅ Enforce Correct Hook Order
      'react-hooks/rules-of-hooks': 'error', // Ensure hooks follow React rules
      'react-hooks/exhaustive-deps': 'warn', // Warn about missing dependencies in useEffect

      // ✅ Enforce Proper Import Order & Grouping
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Built-in Node.js modules (fs, path)
            'external', // Packages from node_modules (react, next, axios)
            'internal', // Absolute imports (from @/aliases)
            ['parent', 'sibling', 'index'], // Relative imports
            'object', // Imports like JSON
            'type', // Type imports (for TypeScript)
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],

      // ✅ Enforce Hooks at the Top (Ensures hooks are used before other logic)
      'react/sort-comp': [
        'error',
        {
          order: [
            'static-variables',
            'static-methods',
            'lifecycle',
            'hooks', // 🔥 Ensure hooks appear first!
            'everything-else',
            'render',
          ],
        },
      ],

      // ✅ Performance & Optimization
      'no-constant-condition': ['error', { checkLoops: false }], // Prevent infinite loops
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lodash',
              message: 'Use specific lodash methods like `lodash/map` instead.',
            },
          ],
          patterns: ['lodash/*'],
        },
      ],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'prefer-template': 'error', // Enforce template literals instead of string concatenation
      'no-duplicate-imports': 'error', // Disallow duplicate imports
      'object-shorthand': 'error', // Enforce shorthand property names
    },
  },
];
