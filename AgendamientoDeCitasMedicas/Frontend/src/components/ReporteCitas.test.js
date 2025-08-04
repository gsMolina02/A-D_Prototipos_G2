import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from './AuthContext';
import ReporteCitas from './ReporteCitas';
import axios from 'axios';

jest.mock('./AuthContext');
jest.mock('axios');

describe('ReporteCitas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('solo permite acceso a médicos', () => {
    useAuth.mockReturnValue({ usuarioActual: { rol: 'paciente' } });
    render(<ReporteCitas />);
    expect(screen.getByText(/Solo los médicos pueden acceder a este reporte/i)).toBeInTheDocument();
  });

  it('renderiza el formulario si el usuario es doctor', () => {
    useAuth.mockReturnValue({ usuarioActual: { rol: 'doctor' } });
    render(<ReporteCitas />);
    expect(screen.getByText('Generar Reporte de Citas')).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha fin/i)).toBeInTheDocument();
  });

  it('muestra mensaje si no hay datos para el periodo seleccionado', async () => {
    useAuth.mockReturnValue({ usuarioActual: { rol: 'doctor' } });
    axios.post.mockResolvedValueOnce({ data: { citas: [], totales: null } });

    render(<ReporteCitas />);
    fireEvent.change(screen.getByLabelText(/Fecha inicio/i), { target: { value: '2025-07-01' } });
    fireEvent.change(screen.getByLabelText(/Fecha fin/i), { target: { value: '2025-07-31' } });
    fireEvent.click(screen.getByRole('button', { name: /Generar/i }));

    await waitFor(() => {
      expect(screen.getByText(/No hay datos para el periodo seleccionado/i)).toBeInTheDocument();
    });
  });

  it('muestra los datos de las citas en la tabla', async () => {
    useAuth.mockReturnValue({ usuarioActual: { rol: 'doctor' } });
    const citasMock = [
      { paciente_nombre: 'Juan Pérez', dia: '2025-07-28', horario: '10:00 AM', estado: 'Agendada' },
      { paciente_nombre: 'María López', dia: '2025-07-29', horario: '11:00 AM', estado: 'Atendida' },
    ];
    axios.post.mockResolvedValueOnce({ data: { citas: citasMock, totales: { total_agendadas: 1, total_canceladas: 0, total_atendidas: 1 } } });

    render(<ReporteCitas />);
    fireEvent.change(screen.getByLabelText(/Fecha inicio/i), { target: { value: '2025-07-01' } });
    fireEvent.change(screen.getByLabelText(/Fecha fin/i), { target: { value: '2025-07-31' } });
    fireEvent.click(screen.getByRole('button', { name: /Generar/i }));

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María López')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('11:00 AM')).toBeInTheDocument();
      expect(screen.getByText('Agendada')).toBeInTheDocument();
      expect(screen.getByText('Atendida')).toBeInTheDocument();
    });
  });

  it('muestra el gráfico de totales si hay datos', async () => {
    useAuth.mockReturnValue({ usuarioActual: { rol: 'doctor' } });
    const citasMock = [
      { paciente_nombre: 'Juan Pérez', dia: '2025-07-28', horario: '10:00 AM', estado: 'Agendada' },
    ];
    axios.post.mockResolvedValueOnce({ data: { citas: citasMock, totales: { total_agendadas: 1, total_canceladas: 0, total_atendidas: 0 } } });

    render(<ReporteCitas />);
    fireEvent.change(screen.getByLabelText(/Fecha inicio/i), { target: { value: '2025-07-01' } });
    fireEvent.change(screen.getByLabelText(/Fecha fin/i), { target: { value: '2025-07-31' } });
    fireEvent.click(screen.getByRole('button', { name: /Generar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Agendadas/i)).toBeInTheDocument();
      expect(screen.getByText(/Canceladas/i)).toBeInTheDocument();
      expect(screen.getByText(/Atendidas/i)).toBeInTheDocument();
    });
  });
});