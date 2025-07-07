import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import CalendarioLaboral from './components/CalendarioLaboral';
import ListaCitas from './components/ListasCitas';  // <-- Importa el nuevo componente
import './App.css';
import Notificaciones from './components/Notificaciones';


// Componente Dashboard (mostrar cuando usuario está logueado)
const Dashboard = () => {
  const { usuarioActual, cerrarSesion } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('perfil');

  const renderVistaActiva = () => {
    switch (vistaActiva) {
      case 'calendario':
        return <CalendarioLaboral />;
      case 'citas':  // <-- Nueva vista para mostrar citas
        return <ListaCitas />;
      case 'perfil':
      default:
        return (
          <div className="user-info">
            <h3>Información del Usuario</h3>
            <p><strong>Nombre:</strong> {usuarioActual.name} {usuarioActual.apellido}</p>
            <p><strong>Email:</strong> {usuarioActual.email}</p>
            <p><strong>Rol:</strong> {usuarioActual.rol}</p>
            <p><strong>Cédula:</strong> {usuarioActual.cedula}</p>
            <p><strong>Teléfono:</strong> {usuarioActual.telefono}</p>
          </div>
        );
    }
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>¡Bienvenido, {usuarioActual.name}!</h2>
          
          <button 
            onClick={cerrarSesion}
            className="logout-button"
          >
            Cerrar Sesión
          </button>
        </div>
        
        {/* Navegación del dashboard */}
        <nav
          className="dashboard-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <button
              className={`nav-button ${vistaActiva === 'perfil' ? 'active' : ''}`}
              onClick={() => setVistaActiva('perfil')}
            >
              Mi Perfil
            </button>
            <button
              className={`nav-button ${vistaActiva === 'calendario' ? 'active' : ''}`}
              onClick={() => setVistaActiva('calendario')}
            >
              Calendario Laboral
            </button>
            <button
              className={`nav-button ${vistaActiva === 'citas' ? 'active' : ''}`}
              onClick={() => setVistaActiva('citas')}
            >
              Mis Citas
            </button>
          </div>
          <div>
            <Notificaciones />
          </div>
        </nav>

        {/* Contenido dinámico */}
        <div className="dashboard-content">
          {renderVistaActiva()}
        </div>
      </div>
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
