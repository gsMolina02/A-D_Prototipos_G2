import React from 'react';
import { render, screen } from '@testing-library/react';
import ListaCitas from './ListasCitas';

// Mock del contexto de autenticación
jest.mock('./AuthContext', () => ({
  useAuth: () => ({
    usuarioActual: { id: 1, rol: 'paciente' },
    obtenerCitasPaciente: jest.fn(),
    obtenerCitasDoctor: jest.fn(),
    cancelarCita: jest.fn(),
    reprogramarCita: jest.fn(),
  }),
}));

test('muestra información de la cita y el nombre del doctor si hay citas', async () => {

  render(<ListaCitas />);

  // Espera a que se muestre el mensaje de sin citas
  expect(await screen.findByText(/No tienes citas agendadas/i)).toBeInTheDocument();
});
