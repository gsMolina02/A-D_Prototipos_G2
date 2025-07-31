import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Notificaciones from './Notificaciones';
import { useAuth } from './AuthContext';

// Mock del contexto de autenticación
jest.mock('./AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Componente Notificaciones', () => {
  it('muestra notificaciones del usuario actual y marca como leídas al hacer clic', () => {
    const marcarNotificacionesLeidasMock = jest.fn();
    useAuth.mockReturnValue({
      usuarioActual: { id: 1 },
      notificaciones: [
        { id: 1, destinatario_id: 1, mensaje: 'Notificación 1', leida: false },
        { id: 2, destinatario_id: 2, mensaje: 'Notificación 2', leida: false },
      ],
      notificacionNoLeida: true,
      marcarNotificacionesLeidas: marcarNotificacionesLeidasMock,
    });

    render(<Notificaciones />);

    // Simula clic en el ícono de notificaciones para hacerlas visibles
    fireEvent.click(screen.getByTitle('Notificaciones'));

    // Verifica que solo se muestra la notificación del usuario actual
    expect(screen.getByText('Notificación 1')).toBeInTheDocument();
    expect(screen.queryByText('Notificación 2')).not.toBeInTheDocument();

    // Simula clic en el ícono de notificaciones
    fireEvent.click(screen.getByTitle('Notificaciones'));

    // Verifica que se llama a marcarNotificacionesLeidas
    expect(marcarNotificacionesLeidasMock).toHaveBeenCalled();
  });
});
