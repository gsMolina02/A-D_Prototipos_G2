import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GestionEmails from './GestionEmails';
import { AuthContext } from './AuthContext';
import * as api from '../services/api';

const renderWithAuth = (ui, { user }) => {
  return render(
    <AuthContext.Provider value={{ user }}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('GestionEmails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(api, 'obtenerEstadisticasEmail').mockResolvedValue({ data: { estadisticas: {} } });
  });

  it('muestra mensaje de permisos si el usuario no es doctor ni admin', () => {
    renderWithAuth(<GestionEmails />, { user: { rol: 'paciente' } });
    expect(screen.getByText(/No tienes permisos para acceder a esta sección/i)).toBeInTheDocument();
  });

  it('renderiza los formularios principales si el usuario es doctor', () => {
    renderWithAuth(<GestionEmails />, { user: { rol: 'doctor' } });
    expect(screen.getByText(/Gestión de Notificaciones por Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Recordatorios Automáticos/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Enviar Confirmación/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cancelar Cita/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Reprogramar Cita/i).length).toBeGreaterThan(0);
  });

  it('envía recordatorios y muestra resultado de éxito', async () => {
    jest.spyOn(api, 'enviarRecordatoriosMasivos').mockResolvedValueOnce({ data: { message: 'Recordatorios enviados', total: 10, enviados: 10, errores: 0 } });
    renderWithAuth(<GestionEmails />, { user: { rol: 'doctor' } });
    fireEvent.click(screen.getByText(/Enviar Recordatorios/i));
    await waitFor(() => {
      expect(screen.getByText(/Recordatorios enviados/i)).toBeInTheDocument();
      expect(screen.getByText(/Total: 10, Enviados: 10/i)).toBeInTheDocument();
    });
  });

  it('envía email de confirmación y muestra resultado', async () => {
    jest.spyOn(api, 'enviarEmailConfirmacion').mockResolvedValueOnce({ data: { message: 'Confirmación enviada' } });
    renderWithAuth(<GestionEmails />, { user: { rol: 'doctor' } });
    const inputId = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(inputId, { target: { value: '123' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Enviar Confirmación/i })[0]);
    await waitFor(() => {
      expect(screen.getByText(/Email de confirmación enviado/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirmación enviada/i)).toBeInTheDocument();
    });
  });

  it('envía email de cancelación y muestra resultado', async () => {
    jest.spyOn(api, 'enviarEmailCancelacion').mockResolvedValueOnce({ data: { message: 'Cancelación enviada' } });
    renderWithAuth(<GestionEmails />, { user: { rol: 'doctor' } });
    const inputId = screen.getAllByRole('spinbutton')[1];
    fireEvent.change(inputId, { target: { value: '456' } });
    const textareaMotivo = screen.getAllByRole('textbox').find(el => el.tagName === 'TEXTAREA');
    fireEvent.change(textareaMotivo, { target: { value: 'Motivo X' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Cancelar Cita/i })[0]);
    await waitFor(() => {
      expect(screen.getByText(/Email de cancelación enviado/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancelación enviada/i)).toBeInTheDocument();
    });
  });

  it('envía email de reprogramación y muestra resultado', async () => {
    jest.spyOn(api, 'enviarEmailReprogramacion').mockResolvedValueOnce({ data: { message: 'Reprogramación enviada' } });
    renderWithAuth(<GestionEmails />, { user: { rol: 'doctor' } });
    const inputId = screen.getAllByRole('spinbutton')[2];
    fireEvent.change(inputId, { target: { value: '789' } });
    const fechaInput = screen.getAllByPlaceholderText(/Ingrese el ID de la cita/i)[2].parentElement.parentElement.querySelector('input[type="date"]');
    fireEvent.change(fechaInput, { target: { value: '2025-08-01' } });
    const horaInput = screen.getAllByPlaceholderText(/Ingrese el ID de la cita/i)[2].parentElement.parentElement.querySelector('input[type="time"]');
    fireEvent.change(horaInput, { target: { value: '10:00' } });
    const motivoTextarea = screen.getAllByPlaceholderText(/Ingrese el motivo de la reprogramación/i)[0];
    fireEvent.change(motivoTextarea, { target: { value: 'Motivo Y' } });
    fireEvent.click(screen.getByRole('button', { name: /Reprogramar Cita/i }));
    await waitFor(() => {
      expect(screen.getByText(/Email de reprogramación enviado/i)).toBeInTheDocument();
      expect(screen.getByText(/Reprogramación enviada/i)).toBeInTheDocument();
    });
  });
});
