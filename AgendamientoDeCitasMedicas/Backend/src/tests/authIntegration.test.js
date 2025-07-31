const request = require('supertest');
const app = require('../server'); // Asegúrate de que este archivo exporte tu aplicación Express

describe('Pruebas de integración - Autenticación', () => {
  it('debe iniciar sesión correctamente con credenciales válidas', async () => {
    const credenciales = {
      email: 'stevemolin2017@gmail.com', // Asegúrate de que este usuario exista en tu base de datos
      password: '123',
    };

    const res = await request(app)
      .post('/api/auth/login') // Cambia la ruta si es diferente en tu backend
      .send(credenciales);

    expect(res.statusCode).toBe(200); // Verifica que el estado sea 200 (éxito)
    expect(res.body).toHaveProperty('token'); // Verifica que se devuelva un token
    expect(res.body).toHaveProperty('user'); // Verifica que se devuelva información del usuario
    expect(res.body.user.email).toBe(credenciales.email); // Verifica que el email coincida
  });

  it('debe fallar con credenciales inválidas', async () => {
    const credenciales = {
      email: 'usuario_invalido@gmail.com',
      password: 'contraseña_incorrecta',
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(credenciales);

    expect(res.statusCode).toBe(401); // Verifica que el estado sea 401 (no autorizado)
    expect(res.body).toHaveProperty('error'); // Verifica que se devuelva un mensaje de error
  });
});
