module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['import', 'node'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { args: 'none' }],
    complexity: ['warn', 10],
    'no-empty': ['error', { allowEmptyCatch: false }],
    'linebreak-style': 'off', // Desactivado para Windows (CRLF)
    'max-len': ['warn', { code: 120 }], // Aumentado a 120 caracteres
    'comma-dangle': ['error', 'only-multiline'],
    'quote-props': ['error', 'as-needed'],
  },
};
