import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Register from './Register';
import { registerUser } from '../services/api';
import { AuthProvider } from './AuthContext';

// Mock de la función registerUser
jest.mock('../services/api', () => ({
  registerUser: jest.fn(),
}));

describe('Componente Register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra alerta si faltan campos obligatorios', () => {
    global.alert = jest.fn(); // Mock de alert

    render(
      <AuthProvider>
        <Register />
      </AuthProvider>
    );

    // Simula el envío del formulario sin completar los campos
    fireEvent.click(screen.getByText('Registrarse'));

    // Verifica que se muestra la alerta
    expect(global.alert).toHaveBeenCalledWith('Por favor corrige todos los errores antes de continuar');
  });
});
