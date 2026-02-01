import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  obtenerPacientes, 
  obtenerDoctores, 
  obtenerEstadisticasConsultorio,
  obtenerTodasLasCitas,
  obtenerEstadisticasSesiones,
  obtenerEstadisticasSatisfaccion
} from '../services/api';

const PanelAsistente = () => {
  const { usuarioActual, reprogramarCita, cancelarCita, cargarHorariosPorDoctor } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [citas, setCitas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [estadisticasSesiones, setEstadisticasSesiones] = useState(null);
  const [estadisticasSatisfaccion, setEstadisticasSatisfaccion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroDoctor, setFiltroDoctor] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  
  // Estados para reprogramación
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [mostrarModalReprogramar, setMostrarModalReprogramar] = useState(false);
  const [formReprogramar, setFormReprogramar] = useState({
    nuevo_dia: '',
    nuevo_horario: '',
    motivo: ''
  });
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  // Estado para ver detalles de paciente
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [citasPaciente, setCitasPaciente] = useState([]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [pacientesRes, doctoresRes, citasRes, estadisticasRes, sesionesRes, satisfaccionRes] = await Promise.all([
        obtenerPacientes(),
        obtenerDoctores(),
        obtenerTodasLasCitas(),
        obtenerEstadisticasConsultorio(),
        obtenerEstadisticasSesiones(),
        obtenerEstadisticasSatisfaccion()
      ]);
      
      setPacientes(pacientesRes.data);
      setDoctores(doctoresRes.data);
      setCitas(citasRes.data);
      setEstadisticas(estadisticasRes.data);
      setEstadisticasSesiones(sesionesRes.data);
      setEstadisticasSatisfaccion(satisfaccionRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (usuarioActual?.rol === 'asistente') {
      cargarDatos();
    }
  }, [usuarioActual, cargarDatos]);

  // Filtrar citas
  const citasFiltradas = citas.filter(cita => {
    const coincideBusqueda = busqueda === '' || 
      cita.paciente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      cita.doctor_nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideDoctor = filtroDoctor === '' || cita.doctor_id?.toString() === filtroDoctor;
    const coincideEstado = filtroEstado === '' || cita.estado === filtroEstado;
    return coincideBusqueda && coincideDoctor && coincideEstado;
  });

  // Filtrar pacientes
  const pacientesFiltrados = pacientes.filter(paciente => {
    return busqueda === '' || 
      paciente.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
      paciente.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
      paciente.cedula?.includes(busqueda) ||
      paciente.email?.toLowerCase().includes(busqueda.toLowerCase());
  });

  // Funciones auxiliares
  const obtenerNombreDia = (fecha) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const date = new Date(fecha + 'T00:00:00');
    return dias[date.getDay()];
  };

  const generarHorariosCitas = (horario) => {
    const horarios = [];
    const [horaInicio] = horario.hora_inicio.split(':').map(Number);
    const [horaFin] = horario.hora_fin.split(':').map(Number);
    
    for (let hora = horaInicio; hora < horaFin; hora++) {
      horarios.push(`${hora.toString().padStart(2, '0')}:00`);
      horarios.push(`${hora.toString().padStart(2, '0')}:30`);
    }
    return horarios;
  };

  // Manejar reprogramación
  const abrirModalReprogramar = (cita) => {
    setCitaSeleccionada(cita);
    setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
    setHorariosDisponibles([]);
    setMostrarModalReprogramar(true);
  };

  const handleFechaChange = async (fecha) => {
    setFormReprogramar(prev => ({ ...prev, nuevo_dia: fecha, nuevo_horario: '' }));
    
    if (!fecha || !citaSeleccionada) return;
    
    try {
      const dia = obtenerNombreDia(fecha);
      const horariosDoctor = await cargarHorariosPorDoctor(citaSeleccionada.doctor_id);
      const horarioDelDia = horariosDoctor.find(h => h.dia === dia);
      
      if (!horarioDelDia) {
        setHorariosDisponibles([]);
        return;
      }
      
      const todosHorarios = generarHorariosCitas(horarioDelDia);
      
      // Filtrar horarios ocupados
      const citasDelDia = citas.filter(c => 
        c.doctor_id === citaSeleccionada.doctor_id && 
        c.dia === fecha && 
        c.estado !== 'cancelada' &&
        c.id !== citaSeleccionada.id
      );
      
      const horariosOcupados = citasDelDia.map(c => c.horario);
      const disponibles = todosHorarios.filter(h => !horariosOcupados.includes(h));
      
      setHorariosDisponibles(disponibles);
    } catch (error) {
      console.error('Error al obtener horarios:', error);
    }
  };

  const handleReprogramar = async () => {
    if (!formReprogramar.nuevo_dia || !formReprogramar.nuevo_horario) {
      alert('Por favor selecciona fecha y horario');
      return;
    }
    
    try {
      await reprogramarCita(citaSeleccionada.id, formReprogramar);
      alert('Cita reprogramada exitosamente');
      setMostrarModalReprogramar(false);
      cargarDatos();
    } catch (error) {
      alert('Error al reprogramar la cita');
    }
  };

  const handleCancelarCita = async (citaId) => {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (!motivo) return;
    
    try {
      await cancelarCita(citaId, motivo);
      alert('Cita cancelada exitosamente');
      cargarDatos();
    } catch (error) {
      alert('Error al cancelar la cita');
    }
  };

  // Ver detalles de paciente
  const verDetallesPaciente = (paciente) => {
    setPacienteSeleccionado(paciente);
    const citasDelPaciente = citas.filter(c => c.paciente_id === paciente.id);
    setCitasPaciente(citasDelPaciente);
  };

  // Estilos
  const styles = {
    container: {
      padding: '20px'
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      borderBottom: '2px solid #e5e7eb',
      paddingBottom: '10px'
    },
    tab: {
      padding: '10px 20px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      borderRadius: '8px 8px 0 0',
      transition: 'all 0.2s'
    },
    tabActive: {
      background: '#2563eb',
      color: 'white'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#2563eb',
      marginBottom: '5px'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6b7280'
    },
    searchBar: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    input: {
      padding: '10px 15px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '200px'
    },
    select: {
      padding: '10px 15px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '150px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
    },
    th: {
      background: '#f8fafc',
      padding: '15px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '2px solid #e5e7eb'
    },
    td: {
      padding: '15px',
      borderBottom: '1px solid #f3f4f6',
      color: '#4b5563'
    },
    btnPrimary: {
      background: '#2563eb',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      marginRight: '8px'
    },
    btnDanger: {
      background: '#dc2626',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px'
    },
    btnSecondary: {
      background: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px'
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500'
    },
    badgePendiente: {
      background: '#fef3c7',
      color: '#92400e'
    },
    badgeCompletada: {
      background: '#d1fae5',
      color: '#065f46'
    },
    badgeCancelada: {
      background: '#fee2e2',
      color: '#991b1b'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      padding: '30px',
      borderRadius: '16px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '20px',
      color: '#1f2937'
    },
    formGroup: {
      marginBottom: '15px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '500',
      color: '#374151'
    },
    detailCard: {
      background: 'white',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      marginBottom: '20px'
    },
    detailHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: '1px solid #e5e7eb'
    },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: '600'
    },
    detailItem: {
      display: 'flex',
      marginBottom: '10px'
    },
    detailLabel: {
      fontWeight: '600',
      color: '#6b7280',
      width: '120px'
    },
    detailValue: {
      color: '#1f2937'
    }
  };

  const getBadgeStyle = (estado) => {
    switch(estado) {
      case 'pendiente': return { ...styles.badge, ...styles.badgePendiente };
      case 'completada': return { ...styles.badge, ...styles.badgeCompletada };
      case 'cancelada': return { ...styles.badge, ...styles.badgeCancelada };
      default: return styles.badge;
    }
  };

  if (loading && !estadisticas) {
    return <div style={styles.container}>Cargando...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Tabs de navegacion */}
      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(vistaActiva === 'dashboard' ? styles.tabActive : {})}}
          onClick={() => setVistaActiva('dashboard')}
        >
          Dashboard
        </button>
        <button 
          style={{...styles.tab, ...(vistaActiva === 'aceptacion' ? styles.tabActive : {})}}
          onClick={() => setVistaActiva('aceptacion')}
        >
          Aceptacion del Sistema
        </button>
        <button 
          style={{...styles.tab, ...(vistaActiva === 'estadisticas' ? styles.tabActive : {})}}
          onClick={() => setVistaActiva('estadisticas')}
        >
          Estadisticas del Sistema
        </button>
        <button 
          style={{...styles.tab, ...(vistaActiva === 'citas' ? styles.tabActive : {})}}
          onClick={() => setVistaActiva('citas')}
        >
          Gestion de Citas
        </button>
        <button 
          style={{...styles.tab, ...(vistaActiva === 'pacientes' ? styles.tabActive : {})}}
          onClick={() => setVistaActiva('pacientes')}
        >
          Pacientes
        </button>
        <button 
          style={{...styles.tab, ...(vistaActiva === 'doctores' ? styles.tabActive : {})}}
          onClick={() => setVistaActiva('doctores')}
        >
          Doctores
        </button>
      </div>

      {/* Dashboard */}
      {vistaActiva === 'dashboard' && estadisticas && (
        <>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Panel de Control</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{estadisticas.citasHoy}</div>
              <div style={styles.statLabel}>Citas Hoy</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{estadisticas.citasPendientes}</div>
              <div style={styles.statLabel}>Citas Pendientes</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#059669'}}>{estadisticas.citasCompletadasMes}</div>
              <div style={styles.statLabel}>Completadas (Mes)</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#dc2626'}}>{estadisticas.citasCanceladasMes}</div>
              <div style={styles.statLabel}>Canceladas (Mes)</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#7c3aed'}}>{estadisticas.totalPacientes}</div>
              <div style={styles.statLabel}>Total Pacientes</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#0891b2'}}>{estadisticas.totalDoctores}</div>
              <div style={styles.statLabel}>Total Doctores</div>
            </div>
          </div>

          {/* Citas de hoy */}
          <h4 style={{ marginBottom: '15px', color: '#374151' }}>Citas de Hoy</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Hora</th>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Doctor</th>
                <th style={styles.th}>Especialidad</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {citas
                .filter(c => c.dia === new Date().toISOString().split('T')[0])
                .sort((a, b) => a.horario.localeCompare(b.horario))
                .map(cita => (
                  <tr key={cita.id}>
                    <td style={styles.td}>{cita.horario}</td>
                    <td style={styles.td}>{cita.paciente_nombre} {cita.paciente_apellido}</td>
                    <td style={styles.td}>Dr. {cita.doctor_nombre} {cita.doctor_apellido}</td>
                    <td style={styles.td}>{cita.especialidad || 'General'}</td>
                    <td style={styles.td}>
                      <span style={getBadgeStyle(cita.estado)}>{cita.estado}</span>
                    </td>
                  </tr>
                ))}
              {citas.filter(c => c.dia === new Date().toISOString().split('T')[0]).length === 0 && (
                <tr>
                  <td colSpan="5" style={{...styles.td, textAlign: 'center', color: '#9ca3af'}}>
                    No hay citas programadas para hoy
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {/* Aceptacion del Sistema */}
      {vistaActiva === 'aceptacion' && (
        <>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Aceptacion del Sistema de Agendamiento</h3>
          
          {/* Resumen de satisfaccion */}
          <div style={styles.statsGrid}>
            <div style={{...styles.statCard, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'}}>
              <div style={{fontSize: '3rem', marginBottom: '10px'}}>
                {[1, 2, 3, 4, 5].map((estrella) => (
                  <span key={estrella} style={{
                    color: estrella <= Math.round(estadisticasSatisfaccion?.promedioGeneral || 0) ? '#fbbf24' : '#e5e7eb'
                  }}>&#9733;</span>
                ))}
              </div>
              <div style={{...styles.statNumber, fontSize: '2rem'}}>{estadisticasSatisfaccion?.promedioGeneral || '0.00'}</div>
              <div style={styles.statLabel}>Promedio General</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#059669'}}>{estadisticasSatisfaccion?.porcentajeAceptacion || 0}%</div>
              <div style={styles.statLabel}>Tasa de Aceptacion (4-5 estrellas)</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{estadisticasSatisfaccion?.totalCalificaciones || 0}</div>
              <div style={styles.statLabel}>Total de Calificaciones</div>
            </div>
          </div>

          {/* Distribucion de Estrellas */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Distribucion de Calificaciones</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[5, 4, 3, 2, 1].map((estrella) => {
                const cantidad = estadisticasSatisfaccion?.distribucion?.[estrella] || 0;
                const total = estadisticasSatisfaccion?.totalCalificaciones || 1;
                const porcentaje = total > 0 ? (cantidad / total) * 100 : 0;
                return (
                  <div key={estrella} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ minWidth: '80px', display: 'flex', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ color: s <= estrella ? '#fbbf24' : '#e5e7eb', fontSize: '14px' }}>&#9733;</span>
                      ))}
                    </span>
                    <div style={{ flex: 1, height: '24px', background: '#f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${porcentaje}%`,
                        background: estrella >= 4 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                          : estrella === 3 ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
                          : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '12px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                      {cantidad} ({porcentaje.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grafica de Calificaciones por Dia */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Promedio de Calificacion por Dia (Ultimos 30 dias)</h4>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '20px 0' }}>
              {estadisticasSatisfaccion?.calificacionesPorDia?.slice(-30).map((item, index) => {
                const altura = (item.promedio_dia / 5) * 150;
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${altura}px`, 
                        background: item.promedio_dia >= 4 
                          ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                          : item.promedio_dia >= 3 
                          ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)'
                          : 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: '4px'
                      }}
                      title={`${item.fecha}: ${item.promedio_dia} estrellas (${item.total_dia} calificaciones)`}
                    />
                    {index % 5 === 0 && (
                      <span style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px', transform: 'rotate(-45deg)' }}>
                        {item.fecha?.slice(5)}
                      </span>
                    )}
                  </div>
                );
              })}
              {(!estadisticasSatisfaccion?.calificacionesPorDia || estadisticasSatisfaccion.calificacionesPorDia.length === 0) && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  No hay datos de calificaciones aun
                </div>
              )}
            </div>
          </div>

          {/* Grafica de Calificaciones por Mes */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Evolucion de Calificaciones por Mes</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '200px', padding: '20px 0' }}>
              {estadisticasSatisfaccion?.calificacionesPorMes?.map((item, index) => {
                const altura = (item.promedio_mes / 5) * 150;
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      {item.promedio_mes}
                    </span>
                    <div style={{ display: 'flex', marginBottom: '5px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ color: s <= Math.round(item.promedio_mes) ? '#fbbf24' : '#e5e7eb', fontSize: '10px' }}>&#9733;</span>
                      ))}
                    </div>
                    <div 
                      style={{ 
                        width: '50px', 
                        height: `${altura}px`, 
                        background: item.promedio_mes >= 4 
                          ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                          : item.promedio_mes >= 3 
                          ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)'
                          : 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: '4px'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}>{item.mes}</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>({item.total_mes} votos)</span>
                  </div>
                );
              })}
              {(!estadisticasSatisfaccion?.calificacionesPorMes || estadisticasSatisfaccion.calificacionesPorMes.length === 0) && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  No hay datos de calificaciones por mes aun
                </div>
              )}
            </div>
          </div>

          {/* Indicador de Tendencia */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Tendencia de Satisfaccion</h4>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              {estadisticasSatisfaccion?.tendencia?.map((item, index) => (
                <div key={index} style={{
                  padding: '20px 40px',
                  borderRadius: '12px',
                  background: item.periodo === 'actual' ? '#f0fdf4' : '#f8fafc',
                  border: item.periodo === 'actual' ? '2px solid #10b981' : '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                    {item.periodo === 'actual' ? 'Mes Actual' : 'Mes Anterior'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} style={{ color: s <= Math.round(item.promedio) ? '#fbbf24' : '#e5e7eb', fontSize: '20px' }}>&#9733;</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{item.promedio}</div>
                </div>
              ))}
              {(!estadisticasSatisfaccion?.tendencia || estadisticasSatisfaccion.tendencia.length === 0) && (
                <div style={{ color: '#9ca3af', padding: '40px' }}>
                  No hay suficientes datos para mostrar la tendencia
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Estadisticas del Sistema */}
      {vistaActiva === 'estadisticas' && estadisticasSesiones && (
        <>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Estadisticas del Sistema y Escalabilidad</h3>
          
          {/* Resumen de sesiones */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{estadisticasSesiones.tiempoPromedio?.promedio_minutos ? Math.round(estadisticasSesiones.tiempoPromedio.promedio_minutos) : 0}</div>
              <div style={styles.statLabel}>Tiempo Promedio de Sesion (min)</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{estadisticasSesiones.sesionesHoy || 0}</div>
              <div style={styles.statLabel}>Sesiones Hoy</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#059669'}}>{estadisticasSesiones.sesionesSemana || 0}</div>
              <div style={styles.statLabel}>Sesiones Esta Semana</div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statNumber, color: '#7c3aed'}}>{estadisticasSesiones.sesionesMes || 0}</div>
              <div style={styles.statLabel}>Sesiones Este Mes</div>
            </div>
          </div>

          {/* Grafica de Sesiones por Dia */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Sesiones por Dia (Ultimos 30 dias)</h4>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '20px 0' }}>
              {estadisticasSesiones.sesionesPorDia?.slice(-30).map((item, index) => {
                const maxSesiones = Math.max(...(estadisticasSesiones.sesionesPorDia?.map(d => d.total_sesiones) || [1]));
                const altura = maxSesiones > 0 ? (item.total_sesiones / maxSesiones) * 150 : 0;
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${altura}px`, 
                        background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: item.total_sesiones > 0 ? '4px' : '0'
                      }}
                      title={`${item.fecha}: ${item.total_sesiones} sesiones`}
                    />
                    {index % 5 === 0 && (
                      <span style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px', transform: 'rotate(-45deg)' }}>
                        {item.fecha?.slice(5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grafica de Usuarios Activos por Dia */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Usuarios Activos por Dia (Ultimos 30 dias)</h4>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '20px 0' }}>
              {estadisticasSesiones.usuariosActivosPorDia?.slice(-30).map((item, index) => {
                const maxUsuarios = Math.max(...(estadisticasSesiones.usuariosActivosPorDia?.map(d => d.usuarios_unicos) || [1]));
                const altura = maxUsuarios > 0 ? (item.usuarios_unicos / maxUsuarios) * 150 : 0;
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${altura}px`, 
                        background: 'linear-gradient(180deg, #059669 0%, #047857 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: item.usuarios_unicos > 0 ? '4px' : '0'
                      }}
                      title={`${item.fecha}: ${item.usuarios_unicos} usuarios`}
                    />
                    {index % 5 === 0 && (
                      <span style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px', transform: 'rotate(-45deg)' }}>
                        {item.fecha?.slice(5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grafica de Tiempo Promedio de Sesion por Dia */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Tiempo Promedio de Sesion por Dia (min)</h4>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '20px 0' }}>
              {estadisticasSesiones.tiempoPorDia?.slice(-30).map((item, index) => {
                const maxTiempo = Math.max(...(estadisticasSesiones.tiempoPorDia?.map(d => d.promedio_minutos) || [1]));
                const altura = maxTiempo > 0 ? (item.promedio_minutos / maxTiempo) * 150 : 0;
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${altura}px`, 
                        background: 'linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: item.promedio_minutos > 0 ? '4px' : '0'
                      }}
                      title={`${item.fecha}: ${Math.round(item.promedio_minutos)} min`}
                    />
                    {index % 5 === 0 && (
                      <span style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px', transform: 'rotate(-45deg)' }}>
                        {item.fecha?.slice(5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grafica de Crecimiento de Usuarios */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Crecimiento de Usuarios Registrados</h4>
            <div style={{ height: '200px', position: 'relative', padding: '20px 0' }}>
              <svg width="100%" height="150" style={{ overflow: 'visible' }}>
                {estadisticasSesiones.crecimientoUsuarios?.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    points={estadisticasSesiones.crecimientoUsuarios.map((item, index) => {
                      const x = (index / (estadisticasSesiones.crecimientoUsuarios.length - 1)) * 100;
                      const maxUsuarios = Math.max(...estadisticasSesiones.crecimientoUsuarios.map(d => d.total_acumulado));
                      const y = 150 - (item.total_acumulado / maxUsuarios) * 140;
                      return `${x}%,${y}`;
                    }).join(' ')}
                  />
                )}
                {estadisticasSesiones.crecimientoUsuarios?.map((item, index) => {
                  const x = estadisticasSesiones.crecimientoUsuarios.length > 1 
                    ? (index / (estadisticasSesiones.crecimientoUsuarios.length - 1)) * 100 
                    : 50;
                  const maxUsuarios = Math.max(...estadisticasSesiones.crecimientoUsuarios.map(d => d.total_acumulado));
                  const y = 150 - (item.total_acumulado / maxUsuarios) * 140;
                  return (
                    <circle 
                      key={index}
                      cx={`${x}%`}
                      cy={y}
                      r="4"
                      fill="#2563eb"
                    >
                      <title>{item.mes}: {item.total_acumulado} usuarios</title>
                    </circle>
                  );
                })}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                {estadisticasSesiones.crecimientoUsuarios?.slice(0, 6).map((item, index) => (
                  <span key={index} style={{ fontSize: '10px', color: '#9ca3af' }}>{item.mes}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Grafica de Citas por Mes */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Citas por Mes (Ultimos 6 meses)</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '200px', padding: '20px 0' }}>
              {estadisticasSesiones.citasPorMes?.map((item, index) => {
                const maxCitas = Math.max(...(estadisticasSesiones.citasPorMes?.map(d => d.total_citas) || [1]));
                const altura = maxCitas > 0 ? (item.total_citas / maxCitas) * 150 : 0;
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      {item.total_citas}
                    </span>
                    <div 
                      style={{ 
                        width: '40px', 
                        height: `${altura}px`, 
                        background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: item.total_citas > 0 ? '4px' : '0'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}>{item.mes}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Usuarios por Tiempo de Uso */}
          <div style={{...styles.detailCard, marginTop: '20px'}}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>Top 10 Usuarios por Tiempo de Uso</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Rol</th>
                  <th style={styles.th}>Total Sesiones</th>
                  <th style={styles.th}>Tiempo Total (min)</th>
                </tr>
              </thead>
              <tbody>
                {estadisticasSesiones.topUsuarios?.map((usuario, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{usuario.nombre} {usuario.apellido}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: usuario.rol === 'doctor' ? '#d1fae5' : usuario.rol === 'paciente' ? '#dbeafe' : '#fef3c7',
                        color: usuario.rol === 'doctor' ? '#065f46' : usuario.rol === 'paciente' ? '#1e40af' : '#92400e'
                      }}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td style={styles.td}>{usuario.total_sesiones}</td>
                    <td style={styles.td}>{Math.round(usuario.tiempo_total_minutos || 0)}</td>
                  </tr>
                ))}
                {(!estadisticasSesiones.topUsuarios || estadisticasSesiones.topUsuarios.length === 0) && (
                  <tr>
                    <td colSpan="4" style={{...styles.td, textAlign: 'center', color: '#9ca3af'}}>
                      No hay datos de sesiones registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Gestion de Citas */}
      {vistaActiva === 'citas' && (
        <>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Gestion de Citas</h3>
          
          {/* Filtros */}
          <div style={styles.searchBar}>
            <input
              type="text"
              placeholder="Buscar por paciente o doctor..."
              style={styles.input}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select 
              style={styles.select}
              value={filtroDoctor}
              onChange={(e) => setFiltroDoctor(e.target.value)}
            >
              <option value="">Todos los doctores</option>
              {doctores.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.name} {d.apellido}</option>
              ))}
            </select>
            <select 
              style={styles.select}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Hora</th>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Doctor</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.map(cita => (
                <tr key={cita.id}>
                  <td style={styles.td}>{cita.dia}</td>
                  <td style={styles.td}>{cita.horario}</td>
                  <td style={styles.td}>{cita.paciente_nombre} {cita.paciente_apellido}</td>
                  <td style={styles.td}>Dr. {cita.doctor_nombre} {cita.doctor_apellido}</td>
                  <td style={styles.td}>
                    <span style={getBadgeStyle(cita.estado)}>{cita.estado}</span>
                  </td>
                  <td style={styles.td}>
                    {cita.estado === 'pendiente' && (
                      <>
                        <button 
                          style={styles.btnPrimary}
                          onClick={() => abrirModalReprogramar(cita)}
                        >
                          Reprogramar
                        </button>
                        <button 
                          style={styles.btnDanger}
                          onClick={() => handleCancelarCita(cita.id)}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Lista de Pacientes */}
      {vistaActiva === 'pacientes' && !pacienteSeleccionado && (
        <>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Directorio de Pacientes</h3>
          
          <div style={styles.searchBar}>
            <input
              type="text"
              placeholder="Buscar por nombre, cedula o email..."
              style={{...styles.input, flex: 1}}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Cédula</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.map(paciente => (
                <tr key={paciente.id}>
                  <td style={styles.td}>{paciente.name} {paciente.apellido}</td>
                  <td style={styles.td}>{paciente.cedula}</td>
                  <td style={styles.td}>{paciente.email}</td>
                  <td style={styles.td}>{paciente.telefono}</td>
                  <td style={styles.td}>
                    <button 
                      style={styles.btnPrimary}
                      onClick={() => verDetallesPaciente(paciente)}
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Detalle de Paciente */}
      {vistaActiva === 'pacientes' && pacienteSeleccionado && (
        <>
          <button 
            style={{...styles.btnSecondary, marginBottom: '20px'}}
            onClick={() => setPacienteSeleccionado(null)}
          >
            ← Volver a la lista
          </button>
          
          <div style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <div style={styles.avatar}>
                {pacienteSeleccionado.name.charAt(0)}{pacienteSeleccionado.apellido.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#1f2937' }}>
                  {pacienteSeleccionado.name} {pacienteSeleccionado.apellido}
                </h3>
                <span style={{ color: '#6b7280' }}>Paciente</span>
              </div>
            </div>
            
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Email:</span>
              <span style={styles.detailValue}>{pacienteSeleccionado.email}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Telefono:</span>
              <span style={styles.detailValue}>{pacienteSeleccionado.telefono}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Cedula:</span>
              <span style={styles.detailValue}>{pacienteSeleccionado.cedula}</span>
            </div>
          </div>

          <h4 style={{ marginBottom: '15px', color: '#374151' }}>Historial de Citas</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Hora</th>
                <th style={styles.th}>Doctor</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citasPaciente.length > 0 ? citasPaciente.map(cita => (
                <tr key={cita.id}>
                  <td style={styles.td}>{cita.dia}</td>
                  <td style={styles.td}>{cita.horario}</td>
                  <td style={styles.td}>Dr. {cita.doctor_nombre} {cita.doctor_apellido}</td>
                  <td style={styles.td}>
                    <span style={getBadgeStyle(cita.estado)}>{cita.estado}</span>
                  </td>
                  <td style={styles.td}>
                    {cita.estado === 'pendiente' && (
                      <>
                        <button 
                          style={styles.btnPrimary}
                          onClick={() => abrirModalReprogramar(cita)}
                        >
                          Reprogramar
                        </button>
                        <button 
                          style={styles.btnDanger}
                          onClick={() => handleCancelarCita(cita.id)}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{...styles.td, textAlign: 'center', color: '#9ca3af'}}>
                    Este paciente no tiene citas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {/* Lista de Doctores */}
      {vistaActiva === 'doctores' && (
        <>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Directorio de Doctores</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {doctores.map(doctor => (
              <div key={doctor.id} style={styles.detailCard}>
                <div style={styles.detailHeader}>
                  <div style={{...styles.avatar, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'}}>
                    {doctor.name.charAt(0)}{doctor.apellido.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#1f2937' }}>
                      Dr. {doctor.name} {doctor.apellido}
                    </h3>
                    <span style={{ color: '#059669', fontWeight: '500' }}>Médico</span>
                  </div>
                </div>
                
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Email:</span>
                  <span style={styles.detailValue}>{doctor.email}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Telefono:</span>
                  <span style={styles.detailValue}>{doctor.telefono}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Citas hoy:</span>
                  <span style={styles.detailValue}>
                    {citas.filter(c => c.doctor_id === doctor.id && c.dia === new Date().toISOString().split('T')[0] && c.estado !== 'cancelada').length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de Reprogramación */}
      {mostrarModalReprogramar && citaSeleccionada && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Reprogramar Cita</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ margin: '5px 0', color: '#6b7280' }}>
                <strong>Paciente:</strong> {citaSeleccionada.paciente_nombre} {citaSeleccionada.paciente_apellido}
              </p>
              <p style={{ margin: '5px 0', color: '#6b7280' }}>
                <strong>Doctor:</strong> Dr. {citaSeleccionada.doctor_nombre} {citaSeleccionada.doctor_apellido}
              </p>
              <p style={{ margin: '5px 0', color: '#6b7280' }}>
                <strong>Fecha actual:</strong> {citaSeleccionada.dia} a las {citaSeleccionada.horario}
              </p>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Nueva Fecha</label>
              <input
                type="date"
                style={{...styles.input, width: '100%'}}
                value={formReprogramar.nuevo_dia}
                onChange={(e) => handleFechaChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Nuevo Horario</label>
              <select
                style={{...styles.select, width: '100%'}}
                value={formReprogramar.nuevo_horario}
                onChange={(e) => setFormReprogramar(prev => ({ ...prev, nuevo_horario: e.target.value }))}
                disabled={horariosDisponibles.length === 0}
              >
                <option value="">Seleccione un horario</option>
                {horariosDisponibles.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {formReprogramar.nuevo_dia && horariosDisponibles.length === 0 && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '5px' }}>
                  El doctor no tiene horario disponible este día
                </p>
              )}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Motivo de reprogramación</label>
              <textarea
                style={{...styles.input, width: '100%', minHeight: '80px', resize: 'vertical'}}
                value={formReprogramar.motivo}
                onChange={(e) => setFormReprogramar(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Ingrese el motivo..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                style={styles.btnSecondary}
                onClick={() => setMostrarModalReprogramar(false)}
              >
                Cancelar
              </button>
              <button 
                style={styles.btnPrimary}
                onClick={handleReprogramar}
              >
                Confirmar Reprogramación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAsistente;
