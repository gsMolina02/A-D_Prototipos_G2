module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb'
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['react', 'jsx-a11y', 'import'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { 'args': 'none' }],
    'react/prop-types': 'off',
    complexity: ['warn', 10]
  },
  settings: {
    react: { version: 'detect' }
  }
};
module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Deshabilitamos las reglas problemáticas en producción
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
    'react-hooks/exhaustive-deps': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
  },
};
