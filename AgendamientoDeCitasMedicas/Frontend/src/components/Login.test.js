import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { useAuth } from './AuthContext';

// Mock del contexto de autenticación
jest.mock('./AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock de window.alert
global.alert = jest.fn();

describe('Componente Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra mensaje de éxito al iniciar sesión correctamente', async () => {
    const iniciarSesionMock = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({ iniciarSesion: iniciarSesionMock });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'stevemolin2017@gmail.com', name: 'email' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: '123', name: 'password' },
    });

    fireEvent.click(screen.getByText('Iniciar sesión'));

    console.log('Mock iniciarSesion llamado con:', iniciarSesionMock.mock.calls);
    console.log('Estado de global.alert:', global.alert);

    await waitFor(() => {
      expect(iniciarSesionMock).toHaveBeenCalledWith('stevemolin2017@gmail.com', '123');
      expect(global.alert).toHaveBeenCalledWith('Sesión iniciada exitosamente');
    });
  });

  it('muestra alerta si faltan campos por completar', () => {
    const iniciarSesionMock = jest.fn();
    useAuth.mockReturnValue({ iniciarSesion: iniciarSesionMock });

    render(<Login />);

    fireEvent.click(screen.getByText('Iniciar sesión'));

    expect(global.alert).toHaveBeenCalledWith('Por favor completa todos los campos');
    expect(iniciarSesionMock).not.toHaveBeenCalled();
  });
});
