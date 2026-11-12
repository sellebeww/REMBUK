import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules/**', 'public/app/js/vendor/**', 'public/app/config.js', 'test-results/**', 'playwright-report/**', 'public/app/sw.js', 'scripts/sw.template.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.mjs', 'server.js', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  { files: ['server.js'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  {
    // Kode peramban lama (global script): dilint longgar, hanya galat nyata.
    files: ['public/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.browser, RembukCore: 'readonly' } },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-undef': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'off',
      'no-cond-assign': 'off',
      'no-redeclare': 'off',
      'no-case-declarations': 'off',
      'no-inner-declarations': 'off',
    },
  },
  { rules: { '@typescript-eslint/no-explicit-any': 'error' } },
);
