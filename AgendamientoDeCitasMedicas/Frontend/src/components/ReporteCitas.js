import React, { useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from './AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReporteCitas = () => {
  const { usuarioActual } = useAuth();
  const [reporte, setReporte] = useState([]);
  const [totales, setTotales] = useState(null);
  const [filtroReporte, setFiltroReporte] = useState({
    fechaInicio: '',
    fechaFin: '',
    campos: {
      paciente: true,
      dia: true,
      horario: true,
      estado: true
    }
  });
  const [loadingReporte, setLoadingReporte] = useState(false);

  const handleFiltroReporteChange = (e) => {
    const { name, value, checked } = e.target;
    if (name in filtroReporte.campos) {
      setFiltroReporte({
        ...filtroReporte,
        campos: { ...filtroReporte.campos, [name]: checked }
      });
    } else {
      setFiltroReporte({ ...filtroReporte, [name]: value });
    }
  };

  const generarReporte = async (e) => {
    e.preventDefault();
    setLoadingReporte(true);
    setReporte([]);
    setTotales(null);
    console.log('Método generarReporte ejecutado');
    try {
      const { fechaInicio, fechaFin, campos } = filtroReporte;
      console.log('URL utilizada para la solicitud:', 'http://localhost:5000/api/citasreportes/reporte');
      console.log('Usuario actual:', usuarioActual);
      const res = await axios.post('http://localhost:5000/api/citasreportes/reporte', {
        fechaInicio,
        fechaFin,
        campos
      });
      console.log('Datos enviados al backend:', { fechaInicio, fechaFin, campos });
      console.log('Respuesta recibida del backend:', res.data);
      setReporte(res.data.citas);
      setTotales(res.data.totales);
      console.log('Citas obtenidas en el reporte:', res.data.citas);
    } catch (err) {
      console.error(err);
      alert('Error al generar el reporte.');
    } finally {
      setLoadingReporte(false);
    }
    console.log('Estado del reporte después de la solicitud:', reporte);
  };

  const data = {
    labels: ['Citas Agendadas', 'Citas Canceladas', 'Citas Atendidas'],
    datasets: [
      {
        label: 'Totales',
        data: totales ? [totales.total_agendadas, totales.total_canceladas, totales.total_atendidas] : [0, 0, 0],
        backgroundColor: ['#4caf50', '#f44336', '#2196f3']
      }
    ]
  };

  const calcularPorcentajes = () => {
    if (!totales) return { agendadas: 0, canceladas: 0, atendidas: 0 };
    const total = totales.total_agendadas + totales.total_canceladas + totales.total_atendidas;
    if (total === 0) return { agendadas: 0, canceladas: 0, atendidas: 0 };
    const agendadas = ((totales.total_agendadas / total) * 100).toFixed(2);
    const canceladas = ((totales.total_canceladas / total) * 100).toFixed(2);
    const atendidas = ((totales.total_atendidas / total) * 100).toFixed(2);
    return { agendadas: parseFloat(agendadas), canceladas: parseFloat(canceladas), atendidas: parseFloat(atendidas) };
  };

  const porcentajes = calcularPorcentajes();

  const formatDay = (dateString) => {
    if (!dateString) return 'Fecha no válida';

    // Detectar formato yyyy-mm-dd
    const regexISODate = /^\d{4}-\d{2}-\d{2}$/;
    if (regexISODate.test(dateString)) {
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate)) return 'Fecha no válida';
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return parsedDate.toLocaleDateString('es-ES', options);
    }

    // Devolver la fecha original si no está en formato yyyy-mm-dd
    return dateString;
  };

  if (!usuarioActual || usuarioActual.rol !== 'doctor') {
    return <p>Solo los médicos pueden acceder a este reporte.</p>;
  }

  return (
    <div className="reporte-citas-box" style={{ margin: '2rem auto', maxWidth: 600, background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
      <h2>📄 Generar Reporte de Citas</h2>
      <form onSubmit={generarReporte} className="form-reporte" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          Fecha inicio:
          <input type="date" name="fechaInicio" value={filtroReporte.fechaInicio} onChange={handleFiltroReporteChange} required />
        </label>
        <label>
          Fecha fin:
          <input type="date" name="fechaFin" value={filtroReporte.fechaFin} onChange={handleFiltroReporteChange} required />
        </label>
        <fieldset style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '0.5rem' }}>
          <legend>Campos a mostrar:</legend>
          <label>
            <input type="checkbox" name="paciente" checked={filtroReporte.campos.paciente} onChange={handleFiltroReporteChange} />
            Paciente
          </label>
          <label>
            <input type="checkbox" name="dia" checked={filtroReporte.campos.dia} onChange={handleFiltroReporteChange} />
            Día
          </label>
          <label>
            <input type="checkbox" name="horario" checked={filtroReporte.campos.horario} onChange={handleFiltroReporteChange} />
            Horario
          </label>
          <label>
            <input type="checkbox" name="estado" checked={filtroReporte.campos.estado} onChange={handleFiltroReporteChange} />
            Estado
          </label>
        </fieldset>
        <button type="submit" disabled={loadingReporte}>Generar</button>
      </form>
      {loadingReporte && <p>Cargando reporte...</p>}
      {reporte.length > 0 && (
        <table className="tabla-reporte" style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {filtroReporte.campos.paciente && <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Paciente</th>}
              {filtroReporte.campos.dia && <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Día</th>}
              {filtroReporte.campos.horario && <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Horario</th>}
              {filtroReporte.campos.estado && <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Estado</th>}
            </tr>
          </thead>
          <tbody>
            {reporte.map((cita, idx) => (
              <tr key={idx}>
                {filtroReporte.campos.paciente && <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{cita.paciente_nombre}</td>}
                {filtroReporte.campos.dia && <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{formatDay(cita.dia)}</td>}
                {filtroReporte.campos.horario && <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{cita.horario}</td>}
                {filtroReporte.campos.estado && <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{cita.estado}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {totales && (
        <div style={{ marginTop: '2rem' }}>
          <Bar data={data} />
          <p style={{ marginTop: '1rem', fontWeight: 'bold'}}>
            Citas agendadas: {porcentajes.agendadas}% | Citas canceladas: {porcentajes.canceladas}% | Citas atendidas: {porcentajes.atendidas}%
          </p>
        </div>
      )}
      {reporte.length === 0 && !loadingReporte && (
        <p style={{ marginTop: '1rem', color: '#888' }}>No hay datos para el periodo seleccionado.</p>
      )}
    </div>
  );
};

export default ReporteCitas;