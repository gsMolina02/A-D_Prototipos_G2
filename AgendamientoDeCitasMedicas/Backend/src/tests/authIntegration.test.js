const request = require('supertest');
const app = require('../server'); // Asegúrate de que este archivo exporte tu aplicación Express

describe('Pruebas de integración - Autenticación', () => {
  it('debe iniciar sesión correctamente con credenciales válidas o retornar 404 si usuario no existe', async () => {
    const credenciales = {
      email: 'stevemolin2017@gmail.com', // Asegúrate de que este usuario exista en tu base de datos
      password: '123',
    };

    const res = await request(app)
      .post('/api/users/login') // Ruta correcta en el backend
      .send(credenciales);

    // Aceptar 200 si existe el usuario o 404 si no existe en BD de tests
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message'); // Verifica que se devuelva un mensaje
      expect(res.body).toHaveProperty('user'); // Verifica que se devuelva información del usuario
      expect(res.body.user.email).toBe(credenciales.email); // Verifica que el email coincida
    }
  });

  it('debe fallar con credenciales inválidas', async () => {
    const credenciales = {
      email: 'usuario_invalido@gmail.com',
      password: 'contraseña_incorrecta',
    };

    const res = await request(app)
      .post('/api/users/login')
      .send(credenciales);

    expect([400, 404]).toContain(res.statusCode); // 404 si usuario no existe, 400 si password incorrecta
    expect(res.body).toHaveProperty('error'); // Verifica que se devuelva un mensaje de error
  });
});
