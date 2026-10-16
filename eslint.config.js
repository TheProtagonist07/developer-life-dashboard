import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Build output, dependencies and generated files are never linted.
  globalIgnores(['**/node_modules', '**/dist', '**/build', '**/.next', '**/out', '**/public']),
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      curly: ['error', 'multi-line'],
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // Existing findings that need a behaviour-aware fix: kept visible as warnings
      // so CI blocks new errors without blocking on the current backlog.
      'no-useless-assignment': 'warn',
    },
  },
  // Express type augmentation (`declare global { namespace Express ... }`) is the official pattern.
  {
    files: ['apps/api/src/types/**/*.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // apps/api (Express) and apps/menubar main process (Electron) run in Node.
  {
    files: ['apps/api/**/*.ts', 'apps/menubar/src/**/*.ts', 'apps/web/*.{js,ts}', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  // apps/web is a Next.js + React app.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, '@next/next': nextPlugin },
    settings: { next: { rootDir: 'apps/web/' } },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      '@next/next/no-location-assign-relative-destination': 'warn',
    },
  },
  // The Electron renderer is plain browser JavaScript.
  {
    files: ['apps/menubar/renderer/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
  // Must be last: switches off any rule that would fight Prettier over formatting.
  prettier,
])
