const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser,
  obtenerPacientes,
  obtenerDoctores,
  obtenerEstadisticasConsultorio,
  cerrarSesion,
  obtenerEstadisticasSesiones,
  guardarCalificacion,
  obtenerEstadisticasSatisfaccion,
  solicitarCambioContrasena,
  cambiarContrasena,
  verificarEstadoCuenta
} = require('../controllers/userController');

// Ruta para login
router.post('/login', loginUser);

// Ruta para registro
router.post('/register', registerUser);

// Ruta para cerrar sesion
router.post('/logout', cerrarSesion);

// Rutas para seguridad de cuenta
router.post('/solicitar-cambio-contrasena', solicitarCambioContrasena);
router.post('/cambiar-contrasena', cambiarContrasena);
router.post('/verificar-estado-cuenta', verificarEstadoCuenta);

// Rutas para asistente organizacional
router.get('/pacientes', obtenerPacientes);
router.get('/doctores', obtenerDoctores);
router.get('/estadisticas', obtenerEstadisticasConsultorio);
router.get('/estadisticas-sesiones', obtenerEstadisticasSesiones);

// Rutas para calificacion de satisfaccion
router.post('/calificacion', guardarCalificacion);
router.get('/estadisticas-satisfaccion', obtenerEstadisticasSatisfaccion);

module.exports = router;
