import React from 'react';
import './styles/LandingPage.css';

const LandingPage = ({ onNavigate }) => {
  return (
    <div className="landing-container">
      {/* Header / Navbar */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon" style={{fontSize: '24px', fontWeight: '700', color: '#2563eb'}}>+</span>
            <span className="logo-text">MediCitas</span>
          </div>
          <nav className="nav-links">
            <a href="#inicio">Inicio</a>
            <a href="#servicios">Servicios</a>
            <a href="#ubicacion">Ubicación</a>
            <button className="btn-login" onClick={() => onNavigate('login')}>
              Iniciar Sesión
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="hero-section">
        <div className="hero-content">
          <h1>Tu salud es nuestra prioridad</h1>
          <p>
            Agenda tus citas médicas de forma rápida y sencilla. 
            Contamos con los mejores especialistas para cuidar de ti y tu familia.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => onNavigate('login')}>
              Agendar una Cita
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('register')}>
              Crear Cuenta
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-card">
            <div className="card-icon" style={{fontSize: '32px', color: '#2563eb', fontWeight: '700'}}>+10</div>
            <h3>Especialistas</h3>
            <p>Médicos certificados</p>
          </div>
          <div className="hero-card">
            <div className="card-icon" style={{fontSize: '14px', color: '#2563eb', fontWeight: '600'}}>L-S</div>
            <h3>Horario Flexible</h3>
            <p>Lun - Sáb</p>
          </div>
          <div className="hero-card">
            <div className="card-icon" style={{fontSize: '20px', color: '#16a34a', fontWeight: '700'}}>&#10003;</div>
            <h3>Citas Online</h3>
            <p>Fácil y rápido</p>
          </div>
        </div>
      </section>

      {/* Servicios Section */}
      <section id="servicios" className="services-section">
        <div className="section-header">
          <h2>Nuestros Servicios</h2>
          <p>Ofrecemos atención médica integral con especialistas en diversas áreas</p>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon" style={{width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: '700', fontSize: '20px'}}>MG</div>
            <h3>Medicina General</h3>
            <p>Consultas de rutina, chequeos preventivos y diagnóstico de enfermedades comunes.</p>
          </div>
          <div className="service-card">
            <div className="service-icon" style={{width: '48px', height: '48px', background: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontWeight: '700', fontSize: '20px'}}>CA</div>
            <h3>Cardiología</h3>
            <p>Evaluación y tratamiento de enfermedades del corazón y sistema cardiovascular.</p>
          </div>
          <div className="service-card">
            <div className="service-icon" style={{width: '48px', height: '48px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: '700', fontSize: '20px'}}>TR</div>
            <h3>Traumatología</h3>
            <p>Atención especializada en lesiones musculoesqueléticas y rehabilitación.</p>
          </div>
          <div className="service-card">
            <div className="service-icon" style={{width: '48px', height: '48px', background: '#fdf4ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontWeight: '700', fontSize: '20px'}}>PE</div>
            <h3>Pediatría</h3>
            <p>Cuidado integral de la salud de bebés, niños y adolescentes.</p>
          </div>
          <div className="service-card">
            <div className="service-icon" style={{width: '48px', height: '48px', background: '#fffbeb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', fontWeight: '700', fontSize: '20px'}}>NE</div>
            <h3>Neurología</h3>
            <p>Diagnóstico y tratamiento de trastornos del sistema nervioso.</p>
          </div>
          <div className="service-card">
            <div className="service-icon" style={{width: '48px', height: '48px', background: '#f0f9ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontWeight: '700', fontSize: '20px'}}>OD</div>
            <h3>Odontología</h3>
            <p>Salud bucal completa: limpieza, ortodoncia y tratamientos especializados.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Listo para agendar tu cita?</h2>
          <p>Regístrate ahora y accede a todos nuestros servicios médicos</p>
          <button className="btn-cta" onClick={() => onNavigate('login')}>
            Agendar Cita Ahora
          </button>
        </div>
      </section>

      {/* Ubicación Section */}
      <section id="ubicacion" className="location-section">
        <div className="section-header">
          <h2>Nuestra Ubicación</h2>
          <p>Encuéntranos fácilmente en el corazón de la ciudad</p>
        </div>
        <div className="location-content">
          <div className="location-info">
            <div className="info-item">
              <div className="info-icon" style={{width: '40px', height: '40px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: '600', fontSize: '14px'}}>DIR</div>
              <div className="info-text">
                <h4>Dirección</h4>
                <p>Av. Principal #123, Centro Médico Plaza Salud</p>
                <p>Piso 3, Consultorio 305</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon" style={{width: '40px', height: '40px', background: '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: '600', fontSize: '14px'}}>TEL</div>
              <div className="info-text">
                <h4>Teléfono</h4>
                <p>+593 99 123 4567</p>
                <p>+593 2 234 5678</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon" style={{width: '40px', height: '40px', background: '#fffbeb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', fontWeight: '600', fontSize: '14px'}}>HOR</div>
              <div className="info-text">
                <h4>Horario de Atención</h4>
                <p>Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                <p>Sábados: 8:00 AM - 1:00 PM</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon" style={{width: '40px', height: '40px', background: '#fdf4ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontWeight: '600', fontSize: '12px'}}>@</div>
              <div className="info-text">
                <h4>Email</h4>
                <p>contacto@medicitas.com</p>
                <p>citas@medicitas.com</p>
              </div>
            </div>
          </div>
          <div className="location-map">
            {/* Placeholder para mapa */}
            <div className="map-placeholder">
              <div className="map-icon" style={{fontSize: '24px', color: '#6b7280', fontWeight: '600'}}>MAPA</div>
              <p>Centro Médico Plaza Salud</p>
              <span>Ver en Google Maps</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon" style={{fontSize: '20px', fontWeight: '700', color: '#2563eb'}}>+</span>
              <span className="logo-text">MediCitas</span>
            </div>
            <p>Sistema de agendamiento de citas médicas online. Tu salud, nuestra prioridad.</p>
          </div>
          <div className="footer-links">
            <h4>Enlaces Rápidos</h4>
            <a href="#inicio">Inicio</a>
            <a href="#servicios">Servicios</a>
            <a href="#ubicacion">Ubicación</a>
          </div>
          <div className="footer-contact">
            <h4>Contacto</h4>
            <p>Tel: +593 99 123 4567</p>
            <p>Email: contacto@medicitas.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 MediCitas. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
