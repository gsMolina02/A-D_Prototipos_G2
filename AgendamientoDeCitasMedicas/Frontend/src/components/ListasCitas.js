import React from 'react';
import { useAuth } from './AuthContext';

const ListaCitas = () => {
  const { usuarioActual, obtenerCitasPaciente, obtenerCitasDoctor } = useAuth();

  if (!usuarioActual) {
    return <p>No hay usuario autenticado.</p>;
  }

  let citas = [];
  if (usuarioActual.rol === 'paciente') {
    citas = obtenerCitasPaciente(usuarioActual.email);
  } else if (usuarioActual.rol === 'doctor') {
    citas = obtenerCitasDoctor(usuarioActual.email);
  }

  if (citas.length === 0) {
    return <p>No tienes citas agendadas.</p>;
  }

  return (
    <div>
      <h3>Tus citas agendadas</h3>
      <ul>
        {citas.map(cita => (
          <li key={cita.id} style={{ marginBottom: '10px' }}>
            <strong>Día:</strong> {cita.dia} <br />
            <strong>Horario:</strong> {cita.horario} <br />
            <strong>Estado:</strong> {cita.estado} <br />

            {usuarioActual.rol === 'paciente' ? (
              <>
                <strong>Doctor:</strong> {cita.doctorNombre || 'N/A'} <br />
              </>
            ) : (
              <>
                <strong>Paciente:</strong> {cita.pacienteNombre || 'N/A'} <br />
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
