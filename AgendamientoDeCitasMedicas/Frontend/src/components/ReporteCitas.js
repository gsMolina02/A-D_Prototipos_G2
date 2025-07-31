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
    
    try {
      const { fechaInicio, fechaFin, campos } = filtroReporte;
      const res = await axios.post('http://localhost:5000/api/citasreportes/reporte', {
        fechaInicio,
        fechaFin,
        campos
      });
      
      setReporte(res.data.citas);
      setTotales(res.data.totales);
    } catch (err) {
      alert('Error al generar el reporte.');
    } finally {
      setLoadingReporte(false);
    }
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

    // Asegurarse de que los valores sean números válidos
    const totalAgendadas = parseInt(totales.total_agendadas) || 0;
    const totalCanceladas = parseInt(totales.total_canceladas) || 0;
    const totalAtendidas = parseInt(totales.total_atendidas) || 0;

    const total = totalAgendadas + totalCanceladas + totalAtendidas;
    if (total === 0) return { agendadas: 0, canceladas: 0, atendidas: 0 };

    const agendadas = ((totalAgendadas / total) * 100).toFixed(2);
    const canceladas = ((totalCanceladas / total) * 100).toFixed(2);
    const atendidas = ((totalAtendidas / total) * 100).toFixed(2);

    return {
      agendadas: parseFloat(agendadas),
      canceladas: parseFloat(canceladas),
      atendidas: parseFloat(atendidas),
    };
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
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 24px',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
        borderRadius: '12px',
        border: '2px solid #fbbf24',
        margin: '24px',
        color: '#d97706',
        fontWeight: '600'
      }}>
        Solo los médicos pueden acceder a este reporte.
      </div>
    );
  }

  return (
    <div style={{ 
      margin: '24px auto', 
      maxWidth: '1000px', 
      background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', 
      padding: '32px', 
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h2 style={{
        fontSize: '32px',
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        margin: '0 0 32px 0',
        paddingBottom: '16px',
        borderBottom: '2px solid #2563eb',
        letterSpacing: '-0.025em'
      }}>Generar Reporte de Citas</h2>
      
      <form onSubmit={generarReporte} style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px', 
        alignItems: 'end',
        marginBottom: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha inicio:</span>
          <input 
            type="date" 
            name="fechaInicio" 
            value={filtroReporte.fechaInicio} 
            onChange={handleFiltroReporteChange} 
            required 
            style={{
              padding: '14px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: '#ffffff'
            }}
          />
        </label>
        
        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha fin:</span>
          <input 
            type="date" 
            name="fechaFin" 
            value={filtroReporte.fechaFin} 
            onChange={handleFiltroReporteChange} 
            required 
            style={{
              padding: '14px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: '#ffffff'
            }}
          />
        </label>
        <fieldset style={{ 
          border: '2px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '16px',
          background: '#ffffff',
          gridColumn: 'span 2'
        }}>
          <legend style={{ 
            fontWeight: '600', 
            color: '#374151', 
            fontSize: '14px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            padding: '0 8px'
          }}>Campos a mostrar:</legend>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="paciente" 
                checked={filtroReporte.campos.paciente} 
                onChange={handleFiltroReporteChange}
                style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Paciente</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="dia" 
                checked={filtroReporte.campos.dia} 
                onChange={handleFiltroReporteChange}
                style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Día</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="horario" 
                checked={filtroReporte.campos.horario} 
                onChange={handleFiltroReporteChange}
                style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Horario</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="estado" 
                checked={filtroReporte.campos.estado} 
                onChange={handleFiltroReporteChange}
                style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Estado</span>
            </label>
          </div>
        </fieldset>
        
        <button 
          type="submit" 
          disabled={loadingReporte}
          style={{
            background: loadingReporte 
              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
              : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            fontSize: '16px',
            cursor: loadingReporte ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            gridColumn: 'span 1',
            justifySelf: 'start'
          }}
        >
          {loadingReporte ? 'Generando...' : 'Generar Reporte'}
        </button>
      </form>
      
      {loadingReporte && (
        <div style={{ 
          textAlign: 'center', 
          padding: '24px',
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          borderRadius: '8px',
          color: '#1d4ed8',
          fontWeight: '500',
          border: '1px solid #93c5fd'
        }}>
          Generando reporte...
        </div>
      )}
      
      {reporte.length > 0 && (
        <div style={{ 
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginTop: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
            color: '#ffffff',
            padding: '16px 24px',
            fontWeight: '600',
            fontSize: '18px'
          }}>
            Resultados del Reporte
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontFamily: 'Inter, sans-serif'
            }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {filtroReporte.campos.paciente && (
                    <th style={{ 
                      border: '1px solid #e5e7eb', 
                      padding: '16px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Paciente
                    </th>
                  )}
                  {filtroReporte.campos.dia && (
                    <th style={{ 
                      border: '1px solid #e5e7eb', 
                      padding: '16px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Día
                    </th>
                  )}
                  {filtroReporte.campos.horario && (
                    <th style={{ 
                      border: '1px solid #e5e7eb', 
                      padding: '16px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Horario
                    </th>
                  )}
                  {filtroReporte.campos.estado && (
                    <th style={{ 
                      border: '1px solid #e5e7eb', 
                      padding: '16px', 
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Estado
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {reporte.map((cita, idx) => (
                  <tr key={idx} style={{ 
                    background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                    transition: 'background-color 0.2s'
                  }}>
                    {filtroReporte.campos.paciente && (
                      <td style={{ 
                        border: '1px solid #e5e7eb', 
                        padding: '16px',
                        color: '#374151'
                      }}>
                        {cita.paciente_nombre}
                      </td>
                    )}
                    {filtroReporte.campos.dia && (
                      <td style={{ 
                        border: '1px solid #e5e7eb', 
                        padding: '16px',
                        color: '#374151'
                      }}>
                        {formatDay(cita.dia)}
                      </td>
                    )}
                    {filtroReporte.campos.horario && (
                      <td style={{ 
                        border: '1px solid #e5e7eb', 
                        padding: '16px',
                        color: '#374151'
                      }}>
                        {cita.horario}
                      </td>
                    )}
                    {filtroReporte.campos.estado && (
                      <td style={{ 
                        border: '1px solid #e5e7eb', 
                        padding: '16px'
                      }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          background: cita.estado === 'programada' 
                            ? '#dcfce7' 
                            : cita.estado === 'cancelada' 
                            ? '#fecaca' 
                            : '#dbeafe',
                          color: cita.estado === 'programada' 
                            ? '#059669' 
                            : cita.estado === 'cancelada' 
                            ? '#dc2626' 
                            : '#2563eb'
                        }}>
                          {cita.estado}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {totales && (
        <div style={{ 
          marginTop: '32px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
            color: '#ffffff',
            padding: '16px 24px',
            fontWeight: '600',
            fontSize: '18px'
          }}>
            Estadísticas del Período
          </div>
          
          <div style={{ padding: '24px' }}>
            <Bar 
              data={{
                ...data,
                datasets: [{
                  ...data.datasets[0],
                  backgroundColor: [
                    'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  ],
                  borderRadius: 8,
                  borderSkipped: false
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  },
                  title: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: '#f3f4f6'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
            
            <div style={{ 
              marginTop: '24px',
              padding: '20px',
              background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                  {porcentajes.agendadas}%
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Agendadas
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                  {porcentajes.canceladas}%
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Canceladas
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                  {porcentajes.atendidas}%
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Atendidas
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {reporte.length === 0 && !loadingReporte && (
        <div style={{ 
          textAlign: 'center',
          padding: '40px 24px',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderRadius: '12px',
          border: '2px dashed #9ca3af',
          marginTop: '24px',
          color: '#6b7280',
          fontSize: '16px'
        }}>
          No hay datos para el periodo seleccionado.
        </div>
      )}
    </div>
  );
};

export default ReporteCitas;