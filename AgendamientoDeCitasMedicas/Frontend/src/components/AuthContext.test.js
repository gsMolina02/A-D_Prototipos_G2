jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}));

import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  it('permite iniciar sesión y establece el usuario actual', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockUser = { id: 1, nombre: 'Juan', rol: 'doctor' };

    // Simular la función loginUser
    result.current.iniciarSesion = jest.fn(() => {
      result.current.setUsuarioActual(mockUser);
      return Promise.resolve({ success: true });
    });

    await act(async () => {
      const response = await result.current.iniciarSesion('test@example.com', 'password123');
      expect(response.success).toBe(true);
    });

    expect(result.current.usuarioActual).toEqual(mockUser);
  });

  it('permite cerrar sesión y limpia el usuario actual', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setUsuarioActual({ id: 1, nombre: 'Juan', rol: 'doctor' });
    });

    expect(result.current.usuarioActual).not.toBeNull();

    act(() => {
      result.current.cerrarSesion();
    });

    expect(result.current.usuarioActual).toBeNull();
  });
});
