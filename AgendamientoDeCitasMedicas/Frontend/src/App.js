import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import CalendarioLaboral from './components/CalendarioLaboral';
import ListaCitas from './components/ListasCitas';
import './App.css';
import Notificaciones from './components/Notificaciones';
import ReporteCitas from './components/ReporteCitas'; // Importa el componente de reporte de citas

// Componente Dashboard (mostrar cuando usuario está logueado)
const Dashboard = () => {
  const { usuarioActual, cerrarSesion } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('perfil');

  const renderVistaActiva = () => {
    switch (vistaActiva) {
      case 'calendario':
        return <CalendarioLaboral />;
      case 'citas':
        return <ListaCitas />;
      case 'reporte':
        return <ReporteCitas />;
      case 'perfil':
      default:
        return (
          <div className="profile-section">
            <div className="profile-card">
              <div className="profile-avatar">
                {usuarioActual.name.charAt(0).toUpperCase()}{usuarioActual.apellido.charAt(0).toUpperCase()}
              </div>
              
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">Nombre Completo:</span>
                  <span className="profile-value">{usuarioActual.name} {usuarioActual.apellido}</span>
                </div>
                
                <div className="profile-item">
                  <span className="profile-label">Email:</span>
                  <span className="profile-value">{usuarioActual.email}</span>
                </div>
                
                <div className="profile-item">
                  <span className="profile-label">Rol:</span>
                  <span className={`profile-badge ${usuarioActual.rol}`}>{usuarioActual.rol}</span>
                </div>
                
                <div className="profile-item">
                  <span className="profile-label">Cédula:</span>
                  <span className="profile-value">{usuarioActual.cedula}</span>
                </div>
                
                <div className="profile-item">
                  <span className="profile-label">Teléfono:</span>
                  <span className="profile-value">{usuarioActual.telefono}</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Notificaciones flotantes */}
      <Notificaciones />
      
      {/* Menú lateral */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-avatar">
            {usuarioActual.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <h3>{usuarioActual.name} {usuarioActual.apellido}</h3>
            <span className="user-role">{usuarioActual.rol}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${vistaActiva === 'perfil' ? 'active' : ''}`}
            onClick={() => setVistaActiva('perfil')}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </span>
            <span className="nav-text">Mi Perfil</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${vistaActiva === 'calendario' ? 'active' : ''}`}
            onClick={() => setVistaActiva('calendario')}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            </span>
            <span className="nav-text">Calendario Laboral</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${vistaActiva === 'citas' ? 'active' : ''}`}
            onClick={() => setVistaActiva('citas')}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM16 19H8v-2h8v2zm3-4H5v-2c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v2z"/>
              </svg>
            </span>
            <span className="nav-text">Mis Citas</span>
          </button>
          
          {/* Botón solo visible para médicos */}
          {usuarioActual.rol === 'doctor' && (
            <button
              className={`sidebar-nav-item ${vistaActiva === 'reporte' ? 'active' : ''}`}
              onClick={() => setVistaActiva('reporte')}
            >
                <span className="nav-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </span>
                <span className="nav-text">Reporte de Citas</span>
              </button>
          )}
        </nav>
        
        <div className="sidebar-footer">
          <button 
            onClick={cerrarSesion}
            className="logout-button-sidebar"
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </span>
            <span className="nav-text">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="main-content">
        <div className="content-header">
          <h2>
            {vistaActiva === 'perfil' && 'Mi Perfil'}
            {vistaActiva === 'calendario' && 'Calendario Laboral'}
            {vistaActiva === 'citas' && 'Mis Citas'}
            {vistaActiva === 'reporte' && 'Reporte de Citas'}
          </h2>
        </div>
        
        <div className="content-body">
          {renderVistaActiva()}
        </div>
      </main>
    </div>
  );
};

// Componente que maneja las vistas
const AuthContent = ({ currentView, setCurrentView }) => {
  const { usuarioActual } = useAuth();

  // Si hay un usuario logueado, mostrar dashboard
  if (usuarioActual) {
    return <Dashboard />;
  }

  // Si no hay usuario logueado, mostrar login o register
  switch (currentView) {
    case 'register':
      return <Register onNavigate={setCurrentView} />;
    default:
      return <Login onNavigate={setCurrentView} />;
  }
};

// Componente principal de la aplicación
const App = () => {
  const [currentView, setCurrentView] = useState('login');
  
  return (
    <AuthProvider>
      <div className="app">
        <AuthContent currentView={currentView} setCurrentView={setCurrentView} />
      </div>
    </AuthProvider>
  );
};

export default App;
