module.exports = {
    extends: ['plugin:prettier/recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        project: './tsconfig.json',
        sourceType: 'module',
    },
    plugins: ['filename-rules', 'typescript-sort-keys'],
    rules: {
        'filename-rules/match': ['error', 'kebab-case'],
        'newline-after-var': ['error', 'always'],
        'newline-before-return': 'error',
        'no-console': ['error', { allow: ['warn', 'error', 'debug', 'info'] }],
        'no-param-reassign': 'off',
        'padding-line-between-statements': [
            'error',
            {
                blankLine: 'always',
                next: '*',
                prev: ['const', 'let', 'var'],
            },
            {
                blankLine: 'any',
                next: ['const', 'let', 'var'],
                prev: ['const', 'let', 'var'],
            },
        ],
        'sort-imports': ['error', { memberSyntaxSortOrder: ['multiple', 'single', 'all', 'none'] }],
        'sort-keys': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-var-requires': 'error',
        'typescript-sort-keys/interface': 'error',
        'typescript-sort-keys/string-enum': 'error',
    },
};
