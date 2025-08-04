import React from 'react'; // Importa React al inicio

jest.mock('./AuthContext', () => ({
  useAuth: jest.fn(() => ({
    usuarioActual: { rol: 'doctor', id: 1 },
    horariosPorDoctor: [],
    guardarHorarioDoctor: jest.fn(() => Promise.resolve({ success: true })),
    eliminarHorarioDoctor: jest.fn(),
    limpiarHorariosDoctor: jest.fn(),
    cargarHorariosPorDoctor: jest.fn(),
    cargarTodosLosHorarios: jest.fn(),
    cargarTodasLasCitas: jest.fn(),
    agendarCita: jest.fn(),
    citasAgendadas: [],
    todasLasCitas: []
  }))
}));

// Si solo pruebas la función, no necesitas renderizar el componente
// import { render, screen, waitFor } from '@testing-library/react';
// import CalendarioLaboral from './CalendarioLaboral';

describe('Función validarHorario', () => {
  const validarHorario = (horario, horarios) => {
    const { horaInicio, horaFin, duracionCita, intervalo } = horario;
    if (!horaInicio || !horaFin || !duracionCita || !intervalo) {
      return 'Todos los campos deben estar completos.';
    }
    if (horaFin <= horaInicio) {
      return 'La hora de fin debe ser mayor a la hora de inicio.';
    }
    if (parseInt(duracionCita) <= 0 || parseInt(intervalo) < 0) {
      return 'La duración debe ser mayor a 0 y el intervalo no puede ser negativo.';
    }
    const horariosDelDia = horarios.filter(h => h.dia === horario.dia);
    for (let h of horariosDelDia) {
      const hInicio = h.hora_inicio || h.horaInicio;
      const hFin = h.hora_fin || h.horaFin;
      if (
        (horaInicio >= hInicio && horaInicio < hFin) ||
        (horaFin > hInicio && horaFin <= hFin) ||
        (horaInicio <= hInicio && horaFin >= hFin)
      ) {
        return `Ya existe un horario que se solapa en ${horario.dia} (${hInicio} - ${hFin})`;
      }
    }
    return null;
  };

  it('valida correctamente un horario válido', () => {
    const horarioValido = {
      dia: 'Lunes',
      horaInicio: '08:00',
      horaFin: '12:00',
      duracionCita: '30',
      intervalo: '10'
    };

    const resultado = validarHorario(horarioValido, []);
    expect(resultado).toBeNull(); // No debe haber errores
  });

  it('detecta un horario inválido con hora de fin menor a la de inicio', () => {
    const horarioInvalido = {
      dia: 'Lunes',
      horaInicio: '12:00',
      horaFin: '08:00',
      duracionCita: '30',
      intervalo: '10'
    };

    const resultado = validarHorario(horarioInvalido, []);
    expect(resultado).toBe('La hora de fin debe ser mayor a la hora de inicio.');
  });

  it('detecta un horario que se solapa con otro existente', () => {
    const horariosExistentes = [
      { dia: 'Lunes', horaInicio: '08:00', horaFin: '10:00' },
      { dia: 'Lunes', horaInicio: '10:00', horaFin: '12:00' }
    ];

    const horarioSolapado = {
      dia: 'Lunes',
      horaInicio: '09:00',
      horaFin: '11:00',
      duracionCita: '30',
      intervalo: '10'
    };

    const resultado = validarHorario(horarioSolapado, horariosExistentes);
    expect(resultado).toBe('Ya existe un horario que se solapa en Lunes (08:00 - 10:00)');
  });
});

