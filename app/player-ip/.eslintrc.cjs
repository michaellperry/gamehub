module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',

    // General JavaScript/TypeScript rules
    'no-console': 'off', // Allow console.log for server applications
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Security rules
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    
    // Code quality rules
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    
    // Style rules
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-blocks': 'error',
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    
    // Import rules
    'no-duplicate-imports': 'error',
    
    // Error prevention
    'no-undef': 'error',
    'no-unused-vars': 'off', // Handled by TypeScript
    'no-unreachable': 'error',
    'no-constant-condition': 'error',
    'no-dupe-args': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    'no-ex-assign': 'error',
    'no-extra-boolean-cast': 'error',
    'no-extra-semi': 'error',
    'no-func-assign': 'error',
    'no-inner-declarations': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-obj-calls': 'error',
    'no-regex-spaces': 'error',
    'no-sparse-arrays': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
    
    // Best practices
    'curly': 'error',
    'dot-notation': 'error',
    'eqeqeq': ['error', 'always'],
    'no-caller': 'error',
    'no-else-return': 'error',
    'no-eq-null': 'error',
    'no-floating-decimal': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-new-wrappers': 'error',
    'no-throw-literal': 'error',
    'no-with': 'error',
    'radix': 'error',
    'wrap-iife': ['error', 'any'],
    'yoda': 'error',
    
    // Node.js specific
    'no-mixed-requires': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error',
    'no-process-exit': 'off', // Allow process.exit in CLI scripts
    
    // Async/await best practices
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    'no-await-in-loop': 'warn',
    'no-promise-executor-return': 'error',
    'prefer-promise-reject-errors': 'error',
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.test.ts', '**/test-*.js', '**/test-*.ts'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        // Relax some rules for test files
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'prefer-arrow-callback': 'off', // Allow function expressions in tests
        'no-unused-expressions': 'off', // Allow assertions
      },
    },
    {
      // Script files
      files: ['scripts/**/*.js', 'scripts/**/*.ts'],
      rules: {
        'no-console': 'off', // Allow console in scripts
        'no-process-exit': 'off', // Allow process.exit in scripts
      },
    },
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.min.js',
    'test-data/',
    'backups/',
    'migrations/',
  ],
};