import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ListaCitas = () => {
  const { usuarioActual, obtenerCitasPaciente, obtenerCitasDoctor, cancelarCita, reprogramarCita } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormularioReprogramar, setMostrarFormularioReprogramar] = useState(null);
  const [formReprogramar, setFormReprogramar] = useState({
    nuevo_dia: '',
    nuevo_horario: '',
    motivo: ''
  });

  
  
  useEffect(() => {
    const cargarCitas = async () => {
      if (!usuarioActual) return;

      setLoading(true);
      try {
        let citasData = [];
        if (usuarioActual.rol === 'paciente') {
          citasData = await obtenerCitasPaciente(usuarioActual.id);
        } else if (usuarioActual.rol === 'doctor') {
          citasData = await obtenerCitasDoctor(usuarioActual.id);
        }
        setCitas(citasData);
      } catch (error) {
        console.error('Error al cargar citas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarCitas();
  }, [usuarioActual?.id, usuarioActual?.rol]); // Solo depender de id y rol del usuario

  if (!usuarioActual) {
    return <p>No hay usuario autenticado.</p>;
  }

  if (loading) {
    return <p>Cargando citas...</p>;
  }

  if (citas.length === 0) {
    return <p>No tienes citas agendadas.</p>;
  }

  const handleCancelar = async (citaId) => {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (!motivo) return;

    const result = await cancelarCita(citaId, motivo);
    if (result.success) {
      // Actualizar el estado de la cita como cancelada
      setCitas(prevCitas => prevCitas.map(cita =>
        cita.id === citaId ? { ...cita, estado: 'cancelada', motivo_cancelacion: motivo } : cita
      ));
    } else {
      alert(result.message);
    }
  };

  const handleReprogramar = async (citaId) => {
    if (!formReprogramar.nuevo_dia || !formReprogramar.nuevo_horario) {
      alert('Por favor, complete todos los campos requeridos');
      return;
    }

    const result = await reprogramarCita(citaId, formReprogramar);
    if (result.success) {
      // Recargar citas
      let citasData = [];
      if (usuarioActual.rol === 'paciente') {
        citasData = await obtenerCitasPaciente(usuarioActual.id);
      } else if (usuarioActual.rol === 'doctor') {
        citasData = await obtenerCitasDoctor(usuarioActual.id);
      }
      setCitas(citasData);
      setMostrarFormularioReprogramar(null);
      setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
      alert('Cita reprogramada exitosamente');
    } else {
      alert(result.message);
    }
  };

  const abrirFormularioReprogramar = (citaId) => {
    setMostrarFormularioReprogramar(citaId);
    setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
  };

  const cerrarFormularioReprogramar = () => {
    setMostrarFormularioReprogramar(null);
    setFormReprogramar({ nuevo_dia: '', nuevo_horario: '', motivo: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormReprogramar(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMarcarComoAtendida = async (citaId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/citasreportes/${citaId}/atendida`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
        return;
      }

      const data = await response.json();
      alert(data.message);

      // Actualizar el estado de la cita como atendida
      setCitas(prevCitas => prevCitas.map(cita =>
        cita.id === citaId ? { ...cita, estado: 'atendida' } : cita
      ));
    } catch (error) {
      console.error('Error al marcar cita como atendida:', error);
      alert('Error al marcar cita como atendida.');
    }
  };

  return (
    <div>
      <h3>Tus citas agendadas</h3>
      <ul>
        {citas.map(cita => (
          <li key={cita.id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <strong>Día:</strong> {cita.dia} <br />
            <strong>Horario:</strong> {cita.horario} <br />
            <strong>Estado:</strong> {cita.estado}
            {cita.estado === 'cancelada' && cita.motivo_cancelacion && (
              <> (Motivo: {cita.motivo_cancelacion})</>
            )}
            <br />
            {usuarioActual.rol === 'paciente' ? (
              <>
                <strong>Doctor:</strong> {cita.doctor_name} {cita.doctor_apellido} <br />
              </>
            ) : (
              <>
                <strong>Paciente:</strong> {cita.paciente_name} {cita.paciente_apellido} <br />
              </>
            )}
            <strong>Especialidad:</strong> {cita.especialidad || 'Consulta General'} <br />

            {cita.estado === 'atendida' ? (
              <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Cita atendida</p>
            ) : cita.estado === 'cancelada' ? (
              <p style={{ color: 'red', fontWeight: 'bold' }}>❌ Cita cancelada (Motivo: {cita.motivo_cancelacion})</p>
            ) : (
              <div style={{ marginTop: '10px' }}>
                {usuarioActual.rol === 'doctor' && (
                  <button
                    onClick={() => abrirFormularioReprogramar(cita.id)}
                    style={{
                      marginRight: '10px',
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Reprogramar
                  </button>
                )}
                {usuarioActual.rol === 'doctor' && (
                  <>
                    <button
                      onClick={() => handleCancelar(cita.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar cita
                    </button>
                    <button
                      onClick={() => handleMarcarComoAtendida(cita.id)}
                      style={{
                        marginLeft: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Marcar como atendida
                    </button>
                  </>
                )}
              </div>
            )}

            {mostrarFormularioReprogramar === cita.id && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '5px'
              }}>
                <h4>Reprogramar Cita</h4>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="nuevo_dia">Nueva Fecha:</label>
                  <input
                    type="date"
                    id="nuevo_dia"
                    name="nuevo_dia"
                    value={formReprogramar.nuevo_dia}
                    onChange={handleInputChange}
                    style={{
                      marginLeft: '10px',
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      width: '150px'
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="nuevo_horario">Nueva Hora:</label>
                  <select
                    id="nuevo_horario"
                    name="nuevo_horario"
                    value={formReprogramar.nuevo_horario}
                    onChange={handleInputChange}
                    style={{
                      marginLeft: '10px',
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      width: '120px'
                    }}
                  >
                    <option value="">Seleccionar</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="motivo">Motivo (opcional):</label>
                  <textarea
                    id="motivo"
                    name="motivo"
                    value={formReprogramar.motivo}
                    onChange={handleInputChange}
                    placeholder="Ingrese el motivo de la reprogramación..."
                    style={{
                      marginLeft: '10px',
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      width: '250px',
                      height: '60px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <button
                    onClick={() => handleReprogramar(cita.id)}
                    style={{
                      marginRight: '10px',
                      padding: '8px 15px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={cerrarFormularioReprogramar}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaCitas;