/**
 * Tests unitarios para userController
 * Estos tests verifican las funciones del controlador de usuarios
 */

const { query } = require('../db/db');
const bcrypt = require('bcryptjs');

// Mock de las dependencias
jest.mock('../db/db');
jest.mock('bcryptjs');

// Importar las funciones después de los mocks
const userController = require('../controllers/userController');

describe('userController - Tests Unitarios', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks antes de cada test
    jest.clearAllMocks();
    
    // Mock de request y response
    req = {
      body: {},
      params: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('loginUser', () => {
    it('debe retornar error 404 si el usuario no existe', async () => {
      req.body = {
        email: 'noexiste@test.com',
        password: 'password123'
      };

      query.mockResolvedValue({ rows: [] });

      await userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('debe retornar error 400 si la contraseña es incorrecta', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      query.mockResolvedValue({
        rows: [{
          id: 1,
          email: 'test@test.com',
          password: 'hashedpassword'
        }]
      });

      bcrypt.compare.mockResolvedValue(false);

      await userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Incorrect password' });
    });

    it('debe retornar token y usuario si las credenciales son correctas', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'correctpassword'
      };

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        apellido: 'User',
        rol: 'paciente',
        password: 'hashedpassword'
      };

      query.mockResolvedValue({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValue(true);

      await userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: expect.objectContaining({
            id: 1,
            email: 'test@test.com'
          })
        })
      );
    });
  });

  // Note: userController no exporta getUserById ni getAllUsers
  // Solo exporta loginUser y registerUser

  describe('registerUser', () => {
    it('debe registrar un usuario nuevo con datos válidos', async () => {
      req.body = {
        email: 'nuevo@test.com',
        password: 'password123',
        name: 'Nuevo',
        apellido: 'Usuario',
        cedula: '1713175071', // Cédula ecuatoriana válida
        telefono: '0987654321',
        rol: 'paciente'
      };

      // Mock para verificar email no existe
      query.mockResolvedValueOnce({ rows: [] });
      // Mock para verificar cédula no existe
      query.mockResolvedValueOnce({ rows: [] });
      // Mock para verificar teléfono no existe
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock para hash de password
      bcrypt.hash.mockResolvedValue('hashedpassword');
      
      // Mock para insertar usuario
      query.mockResolvedValueOnce({
        rows: [{
          id: 10,
          email: 'nuevo@test.com',
          name: 'Nuevo',
          apellido: 'Usuario'
        }]
      });

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          user: expect.any(Object)
        })
      );
    });

    it('debe retornar error si el email ya existe', async () => {
      req.body = {
        email: 'existente@test.com',
        password: 'password123',
        name: 'Test',
        apellido: 'User',
        cedula: '1713175071', // Cédula ecuatoriana válida
        telefono: '0987654321',
        rol: 'paciente'
      };

      // Mock de email existente
      query.mockResolvedValue({ 
        rows: [{ id: 1, email: 'existente@test.com' }] 
      });

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('ya está registrado')
        })
      );
    });
  });
});
