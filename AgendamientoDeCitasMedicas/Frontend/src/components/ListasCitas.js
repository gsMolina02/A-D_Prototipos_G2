import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ListaCitas = () => {
  const { usuarioActual, obtenerCitasPaciente, obtenerCitasDoctor, cancelarCita } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);

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
  }, [usuarioActual]);

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
      // Recargar citas
      let citasData = [];
      if (usuarioActual.rol === 'paciente') {
        citasData = await obtenerCitasPaciente(usuarioActual.id);
      } else if (usuarioActual.rol === 'doctor') {
        citasData = await obtenerCitasDoctor(usuarioActual.id);
      }
      setCitas(citasData);
    } else {
      alert(result.message);
    }
  };

  return (
    <div>
      <h3>Tus citas agendadas</h3>
      <ul>
        {citas.map(cita => (
          <li key={cita.id} style={{ marginBottom: '10px' }}>
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
                {cita.estado !== 'cancelada' && (
                  <button onClick={() => handleCancelar(cita.id)}>
                    Cancelar cita
                  </button>
                )}
              </>
            )}
            <strong>Especialidad:</strong> {cita.especialidad || 'Consulta General'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaCitas;
