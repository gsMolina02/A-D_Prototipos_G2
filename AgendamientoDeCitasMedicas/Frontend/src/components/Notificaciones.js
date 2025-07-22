import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const Notificaciones = () => {
  const { usuarioActual, notificaciones = [], notificacionNoLeida, marcarNotificacionesLeidas } = useAuth();
  const [visible, setVisible] = useState(false);

  // Filtra notificaciones para el usuario actual
  const misNotificaciones = notificaciones.filter(n => {
    return n.destinatario_id === usuarioActual?.id;
  });

  const handleToggle = () => {
    setVisible(v => {
      if (!v) marcarNotificacionesLeidas();
      return !v;
    });
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginLeft: 20 }}>
      <span
        style={{
          fontSize: 28,
          color: notificacionNoLeida ? 'red' : '#333',
          cursor: 'pointer'
        }}
        title="Notificaciones"
        onClick={handleToggle}
      >
        &#128276; {/* Unicode campana */}
      </span>
      {notificacionNoLeida && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            width: 16,
            height: 16,
            fontSize: 12,
            textAlign: 'center',
            lineHeight: '16px'
          }}
        >!</span>
      )}
      {/* Lista de notificaciones */}
      {visible && (
        <div style={{
          position: 'absolute',
          top: 35,
          right: 0,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: 6,
          minWidth: 300, // Aumenté el ancho mínimo
          maxHeight: 400, // Aumenté la altura máxima
          overflowY: 'auto',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 10 }}>
            {misNotificaciones.length === 0 ? (
              <li style={{ padding: 8, color: '#888' }}>
                No tienes ninguna notificación
              </li>
            ) : (
              misNotificaciones.sort((a, b) => b.leida - a.leida).map(n => (
                <li key={n.id} style={{ padding: 8, borderBottom: '1px solid #eee', color: n.leida ? '#888' : '#222' }}>
                  {n.mensaje}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;