/**
 * Configuración global de Jest para todos los tests
 * Este archivo se ejecuta antes de cada suite de tests
 */

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

// Aumentar timeout global para tests de integración
jest.setTimeout(30000);

// Suprimir console.log durante tests (opcional)
global.console = {
  ...console,
  log: jest.fn(), // Silenciar logs normales
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn, // Mantener warnings
  error: console.error, // Mantener errors
};

// Mock básico para Twilio (WhatsApp) si no está disponible
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'test-message-sid',
        status: 'sent',
      }),
    },
  }));
});

// Configuración adicional antes de cada test
beforeEach(() => {
  // Limpiar mocks entre tests
  jest.clearAllMocks();
});

// Limpieza después de cada test
afterEach(() => {
  // Liberar recursos si es necesario
});

// Limpieza al final de todas las suites
afterAll(async () => {
  // Cerrar conexiones abiertas
  await new Promise(resolve => setTimeout(resolve, 500));
});
