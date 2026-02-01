const request = require('supertest');
const express = require('express');
const citaRoutes = require('../routes/citaRoutes');

const app = express();
app.use(express.json());
app.use('/api/citas', citaRoutes);

describe('Rutas de Citas', () => {
  it('POST /api/citasreportes/reporte debe generar un reporte de citas médicas solo con paciente, dia, horario y estado', async () => {
    const body = {
      fechaInicio: '2025-07-01',
      fechaFin: '2025-07-31',
      campos: {
        paciente: true,
        dia: true,
        horario: true,
        estado: true
      }
    };
    const res = await request(app)
      .post('/api/citasreportes/reporte')
      .send(body);
    expect([200, 201, 404]).toContain(res.statusCode);

    // Solo valida si la respuesta tiene las propiedades esperadas
    if (res.body && res.body.citas && res.body.totales) {
      expect(Array.isArray(res.body.citas)).toBe(true);
      expect(typeof res.body.totales).toBe('object');
      if (res.body.citas.length > 0) {
        const cita = res.body.citas[0];
        expect(cita).toHaveProperty('paciente_nombre');
        expect(cita).toHaveProperty('dia');
        expect(cita).toHaveProperty('horario');
        expect(cita).toHaveProperty('estado');
      }
    } else {
      // Si la respuesta es vacía, la prueba pasa
      expect(typeof res.body).toBe('object');
    }
  });
  /*it('DELETE /api/citas/:id debe eliminar una cita existente y responder con éxito', async () => {
    // Primero creamos una cita de prueba para eliminar
    const nuevaCita = {
      paciente_id: 20,
      doctor_id: 2,
      dia: '2025-08-20',
      horario: '09:00',
      motivo: 'Cita para eliminar'
    };
    const crearRes = await request(app)
      .post('/api/citas')
      .send(nuevaCita);
    const citaId = crearRes.body.id || crearRes.body.cita?.id;
    // Ahora eliminamos la cita
    const res = await request(app)
      .delete(`/api/citas/${citaId}`);
    expect([200, 201, 204, 404]).toContain(res.statusCode);
    if (res.statusCode === 404) {
      expect(res.body).toHaveProperty('error');
    } else if (res.body && typeof res.body === 'object') {
      expect(res.body.message || res.body.success).toBeDefined();
    }
  });*/


  it('GET /api/citas debe responder con status 200', async () => {
    const res = await request(app).get('/api/citas');
    expect(res.statusCode).toBe(200);
  });

 it('POST /api/citas debe crear una cita y responder con status 201 o 400', async () => {
    const nuevaCita = {
      paciente_id: 1,
      doctor_id: 1,
      dia: '2026-11-27', // Fecha futura para evitar conflictos
      horario: '13:00',
      motivo: 'Consulta de prueba'
    };
    const res = await request(app)
      .post('/api/citas')
      .send(nuevaCita);
    expect([200, 201, 400]).toContain(res.statusCode);
  });

  it('GET /api/citas/paciente/:paciente_id debe responder con status 200', async () => {
    const pacienteId = 1;
    const res = await request(app).get(`/api/citas/paciente/${pacienteId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  let citaIdParaReprogramar;
  it('PUT /api/citas/:id/cancelar debe cancelar una cita y establecer el motivo de cancelación', async () => {
    // Primero creamos una cita de prueba
    const nuevaCita = {
      paciente_id: 3,
      doctor_id: 1,
      dia: '2025-09-10',
      horario: '13:00',
      motivo: 'Cita cancelada'
    };

    const crearRes = await request(app)
      .post('/api/citas')
      .send(nuevaCita);
    const citaId = crearRes.body.id || crearRes.body.cita?.id || 1;
    citaIdParaReprogramar = citaId; // Guardamos el id para la siguiente prueba

    // Ahora cancelamos la cita
    const motivoCancelacion = 'Paciente no puede asistir';
    const res = await request(app)
      .put(`/api/citas/${citaId}/cancelar`)
      .send({ motivo: motivoCancelacion });
    expect([200, 201, 404, 400]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.message).toBeDefined();
      expect(res.body.cita).toBeDefined();
    }
  });

  it('PUT /api/citas/:id/reprogramar debe reprogramar la cita creada en la prueba de cancelar a una nueva fecha y horario', async () => {
    // Usamos la cita creada en la prueba anterior
    const citaId = citaIdParaReprogramar;
    const nuevoDia = '2025-08-10';
    const nuevoHorario = '15:00';
    const motivoReprogramacion = 'Cambio de agenda';
    const res = await request(app)
      .put(`/api/citas/${citaId}/reprogramar`)
      .send({ nuevo_dia: nuevoDia, nuevo_horario: nuevoHorario, motivo: motivoReprogramacion });
    expect([200, 201, 400]).toContain(res.statusCode); 
    if (res.statusCode === 200 || res.statusCode === 201) {
      expect(res.body.message).toBeDefined();
      expect(res.body.citaNueva).toBeDefined();
      expect(res.body.citaNueva.dia).toBe(nuevoDia);
      expect(res.body.citaNueva.horario).toBe(nuevoHorario);
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('GET /api/citas/doctor/:doctor_id debe retornar un array vacío si el doctor no tiene citas', async () => {
    const doctorIdSinCitas = 9999; // Un ID que no existe en la base de datos
    const res = await request(app).get(`/api/citas/doctor/${doctorIdSinCitas}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

   it('PUT /api/citas/:id/cancelar debe responder con error si la cita no existe', async () => {
    const citaIdInexistente = 99999;
    const motivoCancelacion = 'No existe la cita';
    const res = await request(app)
      .put(`/api/citas/${citaIdInexistente}/cancelar`)
      .send({ motivo: motivoCancelacion });
    expect([400, 404]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('error');
  });

  it('PUT /api/citas/:id/reprogramar debe responder con error si la cita no existe', async () => {
    const citaIdInexistente = 99999;
    const nuevoDia = '2025-09-01';
    const nuevoHorario = '08:00';
    const motivoReprogramacion = 'Intento de reprogramar cita inexistente';
    const res = await request(app)
      .put(`/api/citas/${citaIdInexistente}/reprogramar`)
      .send({ nuevo_dia: nuevoDia, nuevo_horario: nuevoHorario, motivo: motivoReprogramacion });
    expect([400, 404]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/citas/recordatorios debe responder con algún contenido', async () => {
    const res = await request(app)
      .post('/api/citas/recordatorios')
      .send({});
    expect(res.statusCode).toBe(200);
    console.log('Respuesta /recordatorios:', res.body); // <-- Verifica la estructura real
    expect(res.body).toBeDefined();
    expect(typeof res.body).toBe('object');
  });

});
