const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  {
    ignores: ['dist/**', 'eslint.config.js', '.prettierrc.js'],
  },
  ...tsPlugin.configs['flat/recommended'],
  reactHooks.configs.flat['recommended-latest'],
  {
    ...react.configs.flat.recommended,
    settings: {
      react: {
        // Pinned explicitly: eslint-plugin-react's "detect" mode calls a
        // removed ESLint context API and crashes under ESLint 10.
        version: '16.9.0',
      },
    },
  },
  prettierRecommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2018,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
];
