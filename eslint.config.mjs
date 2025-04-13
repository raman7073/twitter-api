// eslint.config.mjs
// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin'; // 🔥 Corrected

export default [
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2020, // Changed from 5 to 2020 (TypeScript + Nest needs modern features)
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'], // Correct field; projectService isn't valid
        tsconfigRootDir: new URL('.', import.meta.url).pathname, // Correct usage with import.meta
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
];

// export default tseslint.config(
//   {
//     ignores: ['eslint.config.mjs'],
//   },
//   eslint.configs.recommended,
//   ...tseslint.configs.recommendedTypeChecked,
//   eslintPluginPrettierRecommended,
//   {
//     languageOptions: {
//       globals: {
//         ...globals.node,
//         ...globals.jest,
//       },
//       ecmaVersion: 2020, // Changed from 5 to 2020 (TypeScript + Nest needs modern features)
//       sourceType: 'module',
//       parserOptions: {
//         project: ['./tsconfig.json'], // Correct field; projectService isn't valid
//         tsconfigRootDir: new URL('.', import.meta.url).pathname, // Correct usage with import.meta
//       },
//     },
//   },
//   {
//     rules: {
//       '@typescript-eslint/no-explicit-any': 'off',
//       '@typescript-eslint/no-floating-promises': 'warn',
//       '@typescript-eslint/no-unsafe-argument': 'warn',
//     },
//   },
// );
