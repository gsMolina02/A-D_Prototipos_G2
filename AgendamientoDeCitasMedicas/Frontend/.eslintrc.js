module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Deshabilitamos las reglas problemáticas en producción
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
    'react-hooks/exhaustive-deps': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
  },
};
