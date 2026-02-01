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
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* Botón de notificaciones flotante */}
      <button
        onClick={handleToggle}
        style={{
          position: 'relative',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
        }}
        title="Notificaciones"
      >
        {/* Icono de campana SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        
        {/* Indicador de notificación no leída */}
        {notificacionNoLeida && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#dc2626',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              animation: 'pulse 2s infinite'
            }}
          >
            {misNotificaciones.filter(n => !n.leida).length}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {visible && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.1)',
              zIndex: -1
            }}
            onClick={() => setVisible(false)}
          />
          
          {/* Panel de notificaciones */}
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            minWidth: '360px',
            maxWidth: '400px',
            maxHeight: '500px',
            overflowY: 'auto',
            zIndex: 1001,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontFamily: 'Inter, sans-serif'
          }}>
            {/* Header del panel */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
              borderRadius: '12px 12px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151'
              }}>
                📬 Notificaciones ({misNotificaciones.length})
              </h3>
              <button
                onClick={() => setVisible(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  color: '#6b7280',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#6b7280';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            
            {/* Lista de notificaciones */}
            <div style={{ padding: 0 }}>
              {misNotificaciones.length === 0 ? (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  <div style={{ marginBottom: '8px', opacity: 0.5 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ margin: '0 auto' }}>
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                  </div>
                  No tienes notificaciones
                </div>
              ) : (
                [...misNotificaciones]
                  .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
                  .map((n, index) => (
                    <div 
                      key={n.id} 
                      style={{ 
                        padding: '16px 20px',
                        borderBottom: index < misNotificaciones.length - 1 ? '1px solid #f3f4f6' : 'none',
                        background: n.leida ? '#ffffff' : '#f0f9ff',
                        transition: 'background-color 0.2s',
                        position: 'relative'
                      }}
                    >
                      {!n.leida && (
                        <div style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#2563eb'
                        }} />
                      )}
                      <div style={{
                        fontSize: '14px',
                        color: n.leida ? '#6b7280' : '#374151',
                        lineHeight: '1.5',
                        marginLeft: !n.leida ? '16px' : '0'
                      }}>
                        {n.mensaje}
                      </div>
                      {n.fecha_creacion && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#999',
                          marginTop: '6px',
                          marginLeft: !n.leida ? '16px' : '0'
                        }}>
                          📅 {new Date(n.fecha_creacion).toLocaleString('es-ES')}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Keyframes para la animación pulse */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Notificaciones;