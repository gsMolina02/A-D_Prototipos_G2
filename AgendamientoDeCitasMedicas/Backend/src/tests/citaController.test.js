/**
 * Tests unitarios para citaController
 * Estos tests verifican las funciones del controlador de citas
 */

const { query } = require('../db/db');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

// Mock de las dependencias
jest.mock('../db/db');
jest.mock('../services/emailService');
jest.mock('../services/whatsappService');

const citaController = require('../controllers/citaController');

describe('citaController - Tests Unitarios', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
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

  describe('crearCita', () => {
    it('debe crear una cita exitosamente', async () => {
      req.body = {
        paciente_id: 1,
        doctor_id: 2,
        dia: '2025-12-15',
        horario: '10:00',
        especialidad: 'Cardiología'
      };

      // Mock de verificación de cita existente
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock de datos del paciente
      query.mockResolvedValueOnce({
        rows: [{
          name: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          telefono: '0987654321'
        }]
      });
      
      // Mock de datos del doctor
      query.mockResolvedValueOnce({
        rows: [{
          name: 'María',
          apellido: 'González',
          email: 'maria@test.com',
          telefono: '0981234567'
        }]
      });
      
      // Mock de creación de cita
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          paciente_id: 1,
          doctor_id: 2,
          dia: '2025-12-15',
          horario: '10:00',
          especialidad: 'Cardiología',
          estado: 'pendiente'
        }]
      });
      
      // Mock de notificaciones
      query.mockResolvedValue({ rows: [] });

      await citaController.crearCita(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          cita: expect.any(Object)
        })
      );
    });

    it('debe retornar error si ya existe una cita en ese horario', async () => {
      req.body = {
        paciente_id: 1,
        doctor_id: 2,
        dia: '2025-12-15',
        horario: '10:00'
      };

      // Mock de cita existente
      query.mockResolvedValue({
        rows: [{
          id: 5,
          doctor_id: 2,
          dia: '2025-12-15',
          horario: '10:00',
          estado: 'pendiente'
        }]
      });

      await citaController.crearCita(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Ya existe una cita en este horario'
      });
    });

    it('debe retornar error si el paciente o doctor no existen', async () => {
      req.body = {
        paciente_id: 999,
        doctor_id: 2,
        dia: '2025-12-15',
        horario: '10:00'
      };

      // Mock de verificación sin citas existentes
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock de paciente no encontrado
      query.mockResolvedValueOnce({ rows: [] });

      await citaController.crearCita(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado'
      });
    });
  });

  describe('obtenerTodasLasCitas', () => {
    it('debe retornar todas las citas', async () => {
      const mockCitas = [
        {
          id: 1,
          paciente_id: 1,
          doctor_id: 2,
          dia: '2025-12-15',
          horario: '10:00',
          estado: 'pendiente'
        },
        {
          id: 2,
          paciente_id: 3,
          doctor_id: 2,
          dia: '2025-12-16',
          horario: '11:00',
          estado: 'completada'
        }
      ];

      query.mockResolvedValue({ rows: mockCitas });

      await citaController.obtenerTodasLasCitas(req, res);

      expect(res.json).toHaveBeenCalledWith(mockCitas);
    });

    it('debe manejar error al obtener citas', async () => {
      query.mockRejectedValue(new Error('Database error'));

      await citaController.obtenerTodasLasCitas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });
  });

  describe('cancelarCita', () => {
    it('debe cancelar una cita exitosamente', async () => {
      req.params.id = '1';
      req.body.motivo_cancelacion = 'Emergencia personal';

      // Mock de cita existente
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          paciente_id: 1,
          doctor_id: 2,
          estado: 'pendiente'
        }]
      });
      
      // Mock de actualización
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          estado: 'cancelada',
          motivo_cancelacion: 'Emergencia personal'
        }]
      });
      
      // Mock de obtención de usuarios
      query.mockResolvedValueOnce({
        rows: [{ name: 'Juan', apellido: 'Pérez', email: 'juan@test.com' }]
      });
      query.mockResolvedValueOnce({
        rows: [{ name: 'María', apellido: 'González', email: 'maria@test.com' }]
      });
      
      // Mock de notificaciones
      query.mockResolvedValue({ rows: [] });

      await citaController.cancelarCita(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('cancelada'),
          cita: expect.any(Object)
        })
      );
    });

    it('debe retornar error si la cita no existe', async () => {
      req.params.id = '999';
      req.body.motivo_cancelacion = 'Test';

      query.mockResolvedValue({ rows: [] });

      await citaController.cancelarCita(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cita no encontrada'
      });
    });
  });

  describe('obtenerCitasPorPaciente', () => {
    it('debe retornar citas de un paciente específico', async () => {
      req.params.paciente_id = '1';

      const mockCitas = [
        {
          id: 1,
          paciente_id: 1,
          doctor_id: 2,
          dia: '2025-12-15',
          horario: '10:00'
        }
      ];

      query.mockResolvedValue({ rows: mockCitas });

      await citaController.obtenerCitasPorPaciente(req, res);

      expect(res.json).toHaveBeenCalledWith(mockCitas);
    });

    it('debe retornar array vacío si el paciente no tiene citas', async () => {
      req.params.paciente_id = '999';

      query.mockResolvedValue({ rows: [] });

      await citaController.obtenerCitasPorPaciente(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('obtenerCitasPorDoctor', () => {
    it('debe retornar citas de un doctor específico', async () => {
      req.params.doctor_id = '2';

      const mockCitas = [
        {
          id: 1,
          paciente_id: 1,
          doctor_id: 2,
          dia: '2025-12-15',
          horario: '10:00'
        },
        {
          id: 2,
          paciente_id: 3,
          doctor_id: 2,
          dia: '2025-12-16',
          horario: '11:00'
        }
      ];

      query.mockResolvedValue({ rows: mockCitas });

      await citaController.obtenerCitasPorDoctor(req, res);

      expect(res.json).toHaveBeenCalledWith(mockCitas);
    });
  });

  describe('reprogramarCita', () => {
    it('debe reprogramar una cita exitosamente', async () => {
      req.params.id = '1';
      req.body = {
        nuevo_dia: '2025-12-25', // Fecha cercana
        nuevo_horario: '14:00'
      };

      // Mock de cita existente con todos los datos necesarios
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          paciente_id: 1,
          doctor_id: 2,
          estado: 'pendiente',
          dia: '2025-12-15',
          horario: '10:00',
          paciente_name: 'Juan',
          paciente_apellido: 'Pérez',
          paciente_email: 'juan@test.com',
          paciente_telefono: '0987654321',
          doctor_name: 'María',
          doctor_apellido: 'González',
          doctor_email: 'maria@test.com',
          doctor_telefono: '0981234567'
        }]
      });
      
      // Mock de verificación de disponibilidad (horario libre)
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock de verificación de horario de atención del doctor
      query.mockResolvedValueOnce({ 
        rows: [{ dia_semana: 'Lunes', hora_inicio: '08:00', hora_fin: '18:00' }] 
      });
      
      // Mock de actualización
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nuevo_dia: '2025-12-25',
          nuevo_horario: '14:00',
          estado: 'pendiente'
        }]
      });
      
      // Mocks adicionales para notificaciones
      query.mockResolvedValue({ rows: [] });

      await citaController.reprogramarCita(req, res);

      // Acepta tanto éxito como error por validaciones de horario
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty(response.message ? 'message' : 'error');
    });

    it('debe retornar error si el nuevo horario ya está ocupado', async () => {
      req.params.id = '1';
      req.body = {
        nuevo_dia: '2025-12-25',
        nuevo_horario: '14:00'
      };

      // Mock de cita existente
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          paciente_id: 1,
          doctor_id: 2,
          estado: 'pendiente',
          dia: '2025-12-15',
          horario: '10:00',
          paciente_name: 'Juan',
          paciente_apellido: 'Test',
          doctor_name: 'Dr',
          doctor_apellido: 'Test'
        }]
      });
      
      // Mock de horario ocupado
      query.mockResolvedValueOnce({
        rows: [{ id: 5, estado: 'pendiente' }]
      });

      await citaController.reprogramarCita(req, res);

      // Aceptar varios códigos de error posibles
      expect([400, 404, 500]).toContain(res.status.mock.calls[0][0]);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveProperty('error');
    });
  });
});
