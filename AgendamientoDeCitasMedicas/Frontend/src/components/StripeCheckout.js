import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Cargar Stripe con la clave pública (usar variable de entorno)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_your_test_key');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Estilos para el formulario de pago
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '25px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  priceBox: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '25px'
  },
  priceLabel: {
    fontSize: '14px',
    opacity: 0.9,
    margin: '0 0 5px 0'
  },
  priceAmount: {
    fontSize: '36px',
    fontWeight: '700',
    margin: 0
  },
  detailsBox: {
    background: '#f9fafb',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px'
  },
  detailLabel: {
    color: '#6b7280'
  },
  detailValue: {
    color: '#1f2937',
    fontWeight: '500'
  },
  cardContainer: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px'
  },
  cardLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '10px',
    display: 'block'
  },
  btnPrimary: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  btnSecondary: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    textAlign: 'center'
  },
  success: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '10px'
  },
  testCards: {
    marginTop: '20px',
    padding: '15px',
    background: '#fffbeb',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#92400e'
  },
  testTitle: {
    fontWeight: '600',
    marginBottom: '8px'
  },
  timer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '15px'
  }
};

// Estilos para CardElement de Stripe
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#dc2626',
    },
  },
};

// Formulario de pago con Stripe
const CheckoutForm = ({ 
  clientSecret, 
  citaData, 
  onSuccess, 
  onCancel, 
  tiempoRestante 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: citaData.paciente_nombre,
              email: citaData.paciente_email
            }
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirmar pago y crear cita en el backend
        const response = await fetch(`${API_URL}/pagos/confirmar-pago`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            doctor_id: citaData.doctor_id,
            paciente_id: citaData.paciente_id,
            fecha: citaData.fecha,
            hora: citaData.hora,
            motivo: citaData.motivo,
            paciente_email: citaData.paciente_email,
            paciente_nombre: citaData.paciente_nombre,
            doctor_nombre: citaData.doctor_nombre,
            especialidad: citaData.especialidad
          })
        });

        const result = await response.json();

        if (response.ok) {
          onSuccess(result);
        } else {
          setError(result.error || 'Error al procesar la cita');
        }
      }
    } catch (err) {
      setError('Error al procesar el pago. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSubmit}>
      {tiempoRestante > 0 && (
        <div style={styles.timer}>
          Tiempo restante para completar el pago: <strong>{formatTime(tiempoRestante)}</strong>
        </div>
      )}
      
      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.cardContainer}>
        <label style={styles.cardLabel}>Datos de la tarjeta</label>
        <CardElement options={cardElementOptions} />
      </div>
      
      <button 
        type="submit" 
        style={{...styles.btnPrimary, opacity: loading || !stripe ? 0.7 : 1}}
        disabled={loading || !stripe}
      >
        {loading ? 'Procesando pago...' : `Pagar $${citaData.monto.toFixed(2)} USD`}
      </button>
      
      <button 
        type="button"
        style={styles.btnSecondary}
        onClick={onCancel}
        disabled={loading}
      >
        Cancelar
      </button>
      
      {/* Tarjetas de prueba para sandbox */}
      <div style={styles.testCards}>
        <div style={styles.testTitle}>Tarjetas de prueba (Sandbox):</div>
        <div>Exitosa: 4242 4242 4242 4242</div>
        <div>Rechazada: 4000 0000 0000 0002</div>
        <div>Fecha: Cualquier fecha futura | CVC: Cualquier 3 digitos</div>
      </div>
    </form>
  );
};

// Componente principal de pago
const StripeCheckout = ({ 
  isOpen, 
  onClose, 
  citaData, 
  onPaymentSuccess 
}) => {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(600); // 10 minutos en segundos
  const [sessionId, setSessionId] = useState('');
  const [bloqueoExitoso, setBloqueoExitoso] = useState(false); // Nuevo estado

  useEffect(() => {
    if (isOpen && citaData) {
      // Resetear estados al abrir
      setBloqueoExitoso(false);
      setTiempoRestante(600);
      setError('');
      setClientSecret('');
      iniciarProcesoPago();
    }
    
    return () => {
      // Limpiar al cerrar
      if (!success && sessionId) {
        liberarBloqueo();
      }
    };
  }, [isOpen]);

  // Contador regresivo - SOLO corre si el bloqueo fue exitoso
  useEffect(() => {
    if (!isOpen || success || !bloqueoExitoso) return;
    
    const timer = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('El tiempo de reserva ha expirado. Por favor, seleccione el horario nuevamente.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, success, bloqueoExitoso]);

  const iniciarProcesoPago = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Paso 1: Bloquear horario
      console.log('Intentando bloquear horario:', citaData);
      const bloqueoResponse = await fetch(`${API_URL}/pagos/bloquear-horario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: citaData.doctor_id,
          fecha: citaData.fecha,
          hora: citaData.hora,
          usuario_id: citaData.paciente_id
        })
      });

      const bloqueoResult = await bloqueoResponse.json();
      console.log('Resultado bloqueo:', bloqueoResult);
      
      if (!bloqueoResponse.ok) {
        setError(bloqueoResult.error || 'No se pudo reservar el horario');
        setLoading(false);
        return;
      }

      setSessionId(bloqueoResult.session_id);
      setBloqueoExitoso(true); // Marcar bloqueo exitoso para iniciar timer
      
      // Paso 2: Crear Payment Intent
      const paymentResponse = await fetch(`${API_URL}/pagos/crear-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: citaData.doctor_id,
          fecha: citaData.fecha,
          hora: citaData.hora,
          usuario_id: citaData.paciente_id,
          session_id: bloqueoResult.session_id,
          paciente_email: citaData.paciente_email,
          paciente_nombre: citaData.paciente_nombre
        })
      });

      const paymentResult = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        setError(paymentResult.error || 'Error al iniciar el pago');
        setLoading(false);
        return;
      }

      setClientSecret(paymentResult.clientSecret);
      
    } catch (err) {
      setError('Error de conexion. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const liberarBloqueo = async () => {
    try {
      await fetch(`${API_URL}/pagos/liberar-bloqueo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: citaData.doctor_id,
          fecha: citaData.fecha,
          hora: citaData.hora,
          usuario_id: citaData.paciente_id
        })
      });
    } catch (err) {
      console.error('Error liberando bloqueo:', err);
    }
  };

  const handleSuccess = (result) => {
    setSuccess(true);
    setTimeout(() => {
      onPaymentSuccess(result);
      onClose();
    }, 3000);
  };

  const handleCancel = () => {
    liberarBloqueo();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Pago de Cita Médica</h2>
          <p style={styles.subtitle}>Complete el pago para confirmar su cita</p>
        </div>

        {success ? (
          <div style={styles.success}>
            <div style={styles.successIcon}>&#10003;</div>
            <h3 style={{margin: '0 0 10px 0'}}>Pago Exitoso</h3>
            <p style={{margin: 0}}>Su cita ha sido confirmada. Recibirá un email de confirmación.</p>
          </div>
        ) : (
          <>
            <div style={styles.priceBox}>
              <p style={styles.priceLabel}>Total a pagar</p>
              <p style={styles.priceAmount}>${citaData?.monto?.toFixed(2) || '20.00'} USD</p>
            </div>

            <div style={styles.detailsBox}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Doctor:</span>
                <span style={styles.detailValue}>{citaData?.doctor_nombre || 'Doctor'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Fecha:</span>
                <span style={styles.detailValue}>{citaData?.fecha}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Hora:</span>
                <span style={styles.detailValue}>{citaData?.hora}</span>
              </div>
            </div>

            {loading ? (
              <div style={{textAlign: 'center', padding: '30px'}}>
                <p>Preparando pago...</p>
              </div>
            ) : error ? (
              <>
                <div style={styles.error}>{error}</div>
                <button style={styles.btnSecondary} onClick={handleCancel}>
                  Volver
                </button>
              </>
            ) : clientSecret ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  clientSecret={clientSecret}
                  citaData={citaData}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                  tiempoRestante={tiempoRestante}
                />
              </Elements>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default StripeCheckout;
