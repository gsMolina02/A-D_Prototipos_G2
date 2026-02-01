// userController.js
const { query } = require('../db/db'); // Asegúrate de que esta ruta sea correcta
const bcrypt = require('bcryptjs');

// Validación de solo letras para nombres
const validarSoloLetras = (texto) => {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return regex.test(texto) && texto.trim().length >= 2;
};

// Validación de cédula ecuatoriana
const validarCedula = (cedula) => {
  if (!cedula || cedula.length !== 10) return false;
  
  // Verificar que todos los caracteres sean números
  if (!/^\d+$/.test(cedula)) return false;
  
  // Algoritmo de validación de cédula ecuatoriana
  try {
    const digitoVerificador = parseInt(cedula.charAt(9));
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
      let digito = parseInt(cedula.charAt(i));
      if (i % 2 === 0) { // Posiciones pares (0,2,4,6,8)
        digito *= 2;
        if (digito > 9) {
          digito -= 9;
        }
      }
      suma += digito;
    }
    
    const modulo = suma % 10;
    const verificador = modulo === 0 ? 0 : 10 - modulo;
    
    return verificador === digitoVerificador;
  } catch (error) {
    return false;
  }
};

// Validación de teléfono ecuatoriano
const validarTelefono = (telefono) => {
  if (!telefono || telefono.length !== 10) return false;
  if (!/^\d+$/.test(telefono)) return false;
  
  // Verificar prefijos válidos
  const prefijo = telefono.substring(0, 2);
  const prefijosValidos = ['09', '02', '03', '04', '05', '06', '07'];
  return prefijosValidos.includes(prefijo);
};

// Validación de email
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validación de contraseña
const validarPassword = (password) => {
  return password && password.length >= 6;
};

// Validación de rol
const validarRol = (rol) => {
  const rolesValidos = ['paciente', 'doctor', 'asistente'];
  return rolesValidos.includes(rol);
};


// ...existing code...
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Verificar si la cuenta esta bloqueada
    if (user.cuenta_bloqueada) {
      return res.status(403).json({ 
        error: 'Cuenta bloqueada por multiples intentos fallidos. Debe cambiar su contrasena.',
        bloqueado: true,
        email: user.email
      });
    }

    // Usar bcrypt para comparar la contrasena
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (passwordMatch) {
      // Resetear intentos fallidos al hacer login exitoso
      await query(
        'UPDATE users SET intentos_fallidos = 0 WHERE id = $1',
        [user.id]
      );
      
      // Registrar inicio de sesion
      const sesionResult = await query(
        'INSERT INTO sesiones (usuario_id, inicio_sesion) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id',
        [user.id]
      );
      const sesionId = sesionResult.rows[0].id;
      
      // No enviar campos sensibles
      const { password: _, intentos_fallidos, cuenta_bloqueada, token_recuperacion, token_expiracion, ...userSafe } = user;
      
      res.status(200).json({ message: 'Login successful', user: userSafe, sesionId });
    } else {
      // Incrementar intentos fallidos
      const intentosActuales = (user.intentos_fallidos || 0) + 1;
      
      if (intentosActuales >= 3) {
        // Bloquear cuenta
        await query(
          'UPDATE users SET intentos_fallidos = $1, cuenta_bloqueada = true, fecha_bloqueo = CURRENT_TIMESTAMP WHERE id = $2',
          [intentosActuales, user.id]
        );
        return res.status(403).json({ 
          error: 'Cuenta bloqueada. Ha excedido el numero maximo de intentos (3). Debe cambiar su contrasena para desbloquear.',
          bloqueado: true,
          email: user.email
        });
      } else {
        await query(
          'UPDATE users SET intentos_fallidos = $1 WHERE id = $2',
          [intentosActuales, user.id]
        );
        const intentosRestantes = 3 - intentosActuales;
        return res.status(400).json({ 
          error: `Contrasena incorrecta. Le quedan ${intentosRestantes} intento(s) antes de bloquear la cuenta.`,
          intentosRestantes
        });
      }
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Solicitar cambio de contrasena (genera token)
const solicitarCambioContrasena = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Generar token aleatorio
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiracion = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await query(
      'UPDATE users SET token_recuperacion = $1, token_expiracion = $2 WHERE email = $3',
      [token, expiracion, email]
    );

    res.status(200).json({ 
      message: 'Token de recuperacion generado',
      token, // En produccion esto se enviaria por email
      expiraEn: '30 minutos'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Cambiar contrasena con token
const cambiarContrasena = async (req, res) => {
  const { email, token, nuevaContrasena } = req.body;

  try {
    if (!email || !token || !nuevaContrasena) {
      return res.status(400).json({ error: 'Email, token y nueva contrasena son requeridos' });
    }

    if (nuevaContrasena.length < 6) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Verificar token
    if (user.token_recuperacion !== token) {
      return res.status(400).json({ error: 'Token invalido' });
    }

    // Verificar expiracion
    if (new Date() > new Date(user.token_expiracion)) {
      return res.status(400).json({ error: 'Token expirado. Solicite uno nuevo.' });
    }

    // Hashear nueva contrasena
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar contrasena y desbloquear cuenta
    await query(
      `UPDATE users SET 
        password = $1, 
        intentos_fallidos = 0, 
        cuenta_bloqueada = false, 
        fecha_bloqueo = NULL,
        token_recuperacion = NULL, 
        token_expiracion = NULL 
      WHERE email = $2`,
      [hashedPassword, email]
    );

    res.status(200).json({ message: 'Contrasena cambiada exitosamente. Su cuenta ha sido desbloqueada.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Verificar estado de cuenta
const verificarEstadoCuenta = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await query(
      'SELECT cuenta_bloqueada, intentos_fallidos FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    res.status(200).json({
      bloqueado: user.cuenta_bloqueada,
      intentosFallidos: user.intentos_fallidos
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const registerUser = async (req, res) => {
  const { name, apellido, cedula, email, telefono, password, rol } = req.body;

  try {
    // Validaciones de campos requeridos
    if (!name || !apellido || !cedula || !email || !telefono || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Validación de nombre
    if (!validarSoloLetras(name)) {
      return res.status(400).json({ error: 'El nombre debe contener solo letras y tener al menos 2 caracteres' });
    }

    // Validación de apellido
    if (!validarSoloLetras(apellido)) {
      return res.status(400).json({ error: 'El apellido debe contener solo letras y tener al menos 2 caracteres' });
    }

    // Validación de cédula
    if (!validarCedula(cedula)) {
      return res.status(400).json({ error: 'La cédula ingresada no es válida' });
    }

    // Validación de email
    if (!validarEmail(email)) {
      return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    // Validación de teléfono
    if (!validarTelefono(telefono)) {
      return res.status(400).json({ error: 'El número de teléfono no es válido (debe ser de 10 dígitos y empezar con 09, 02-07)' });
    }

    // Validación de contraseña
    if (!validarPassword(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Validación de rol
    if (!validarRol(rol)) {
      return res.status(400).json({ error: 'El rol debe ser "paciente", "doctor" o "asistente"' });
    }

    // Verificar unicidad de email
    const emailExiste = await query('SELECT id FROM users WHERE email = $1', [email.trim()]);
    if (emailExiste.rows.length > 0) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Verificar unicidad de cédula
    const cedulaExiste = await query('SELECT id FROM users WHERE cedula = $1', [cedula]);
    if (cedulaExiste.rows.length > 0) {
      return res.status(400).json({ error: 'Esta cédula ya está registrada' });
    }

    // Verificar unicidad de teléfono
    const telefonoExiste = await query('SELECT id FROM users WHERE telefono = $1', [telefono]);
    if (telefonoExiste.rows.length > 0) {
      return res.status(400).json({ error: 'Este número de teléfono ya está registrado' });
    }

    // Hashear la contraseña antes de guardarla
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar usuario - usar 'name' que es el campo correcto en la BD
    const result = await query(
      'INSERT INTO users (name, apellido, cedula, email, telefono, password, rol) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, apellido, cedula, email, telefono, rol',
      [name.trim(), apellido.trim(), cedula, email.trim(), telefono, hashedPassword, rol]
    );

    // Usuario registrado exitosamente

    return res.status(201).json({ 
      message: 'Usuario registrado exitosamente', 
      user: result.rows[0] 
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    // Manejar errores específicos de la base de datos
    if (err.code === '23505') { // Código de error para violación de unicidad en PostgreSQL
      if (err.constraint && err.constraint.includes('email')) {
        return res.status(400).json({ error: 'Este email ya está registrado' });
      } else if (err.constraint && err.constraint.includes('cedula')) {
        return res.status(400).json({ error: 'Esta cédula ya está registrada' });
      } else if (err.constraint && err.constraint.includes('telefono')) {
        return res.status(400).json({ error: 'Este número de teléfono ya está registrado' });
      }
    }
    
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos los pacientes (para asistente)
const obtenerPacientes = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, apellido, cedula, email, telefono, rol 
       FROM users 
       WHERE rol = 'paciente' 
       ORDER BY apellido, name`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
};

// Obtener todos los doctores (para asistente y pacientes)
const obtenerDoctores = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, apellido, cedula, email, telefono, rol 
       FROM users 
       WHERE rol = 'doctor' 
       ORDER BY apellido, name`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
};

// Obtener estadísticas del consultorio (para asistente)
const obtenerEstadisticasConsultorio = async (req, res) => {
  try {
    // Total de pacientes
    const pacientesResult = await query(`SELECT COUNT(*) as total FROM users WHERE rol = 'paciente'`);
    
    // Total de doctores
    const doctoresResult = await query(`SELECT COUNT(*) as total FROM users WHERE rol = 'doctor'`);
    
    // Citas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const citasHoyResult = await query(
      `SELECT COUNT(*) as total FROM citas WHERE dia = $1 AND estado != 'cancelada'`,
      [hoy]
    );
    
    // Citas pendientes (futuras)
    const citasPendientesResult = await query(
      `SELECT COUNT(*) as total FROM citas WHERE dia >= $1 AND estado = 'pendiente'`,
      [hoy]
    );
    
    // Citas completadas este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const citasCompletadasResult = await query(
      `SELECT COUNT(*) as total FROM citas WHERE dia >= $1 AND estado = 'completada'`,
      [inicioMes]
    );
    
    // Citas canceladas este mes
    const citasCanceladasResult = await query(
      `SELECT COUNT(*) as total FROM citas WHERE dia >= $1 AND estado = 'cancelada'`,
      [inicioMes]
    );

    res.status(200).json({
      totalPacientes: parseInt(pacientesResult.rows[0].total),
      totalDoctores: parseInt(doctoresResult.rows[0].total),
      citasHoy: parseInt(citasHoyResult.rows[0].total),
      citasPendientes: parseInt(citasPendientesResult.rows[0].total),
      citasCompletadasMes: parseInt(citasCompletadasResult.rows[0].total),
      citasCanceladasMes: parseInt(citasCanceladasResult.rows[0].total)
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Cerrar sesion y registrar tiempo
const cerrarSesion = async (req, res) => {
  const { sesionId } = req.body;
  
  try {
    if (!sesionId) {
      return res.status(400).json({ error: 'ID de sesion requerido' });
    }
    
    // Actualizar sesion con fin y calcular duracion
    await query(`
      UPDATE sesiones 
      SET fin_sesion = CURRENT_TIMESTAMP,
          duracion_minutos = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - inicio_sesion)) / 60
      WHERE id = $1 AND fin_sesion IS NULL
    `, [sesionId]);
    
    res.status(200).json({ message: 'Sesion cerrada exitosamente' });
  } catch (error) {
    console.error('Error al cerrar sesion:', error);
    res.status(500).json({ error: 'Error al cerrar sesion' });
  }
};

// Obtener estadisticas de sesiones para el dashboard
const obtenerEstadisticasSesiones = async (req, res) => {
  try {
    // Tiempo promedio de sesion (en minutos)
    const tiempoPromedioResult = await query(`
      SELECT COALESCE(AVG(duracion_minutos), 0) as promedio
      FROM sesiones 
      WHERE duracion_minutos IS NOT NULL
    `);
    
    // Total de sesiones hoy
    const sesionesHoyResult = await query(`
      SELECT COUNT(*) as total 
      FROM sesiones 
      WHERE DATE(inicio_sesion) = CURRENT_DATE
    `);
    
    // Total de sesiones esta semana
    const sesionesSemanResult = await query(`
      SELECT COUNT(*) as total 
      FROM sesiones 
      WHERE inicio_sesion >= CURRENT_DATE - INTERVAL '7 days'
    `);
    
    // Total de sesiones este mes
    const sesionesMesResult = await query(`
      SELECT COUNT(*) as total 
      FROM sesiones 
      WHERE inicio_sesion >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    // Sesiones por dia (ultimos 30 dias) para grafica
    const sesionesPorDiaResult = await query(`
      SELECT DATE(inicio_sesion) as fecha, COUNT(*) as total
      FROM sesiones
      WHERE inicio_sesion >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(inicio_sesion)
      ORDER BY fecha
    `);
    
    // Usuarios activos por dia (ultimos 30 dias)
    const usuariosActivosPorDiaResult = await query(`
      SELECT DATE(inicio_sesion) as fecha, COUNT(DISTINCT usuario_id) as total
      FROM sesiones
      WHERE inicio_sesion >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(inicio_sesion)
      ORDER BY fecha
    `);
    
    // Tiempo promedio de sesion por dia (ultimos 30 dias)
    const tiempoPorDiaResult = await query(`
      SELECT DATE(inicio_sesion) as fecha, COALESCE(AVG(duracion_minutos), 0) as promedio
      FROM sesiones
      WHERE inicio_sesion >= CURRENT_DATE - INTERVAL '30 days' AND duracion_minutos IS NOT NULL
      GROUP BY DATE(inicio_sesion)
      ORDER BY fecha
    `);
    
    // Crecimiento de usuarios (registros por mes)
    const crecimientoUsuariosResult = await query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as mes, COUNT(*) as total
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes
    `);
    
    // Citas por mes (ultimos 12 meses) para ver escalabilidad
    const citasPorMesResult = await query(`
      SELECT TO_CHAR(fecha_agendada, 'YYYY-MM') as mes, COUNT(*) as total
      FROM citas
      WHERE fecha_agendada >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(fecha_agendada, 'YYYY-MM')
      ORDER BY mes
    `);
    
    // Top 5 usuarios con mas tiempo en sesion
    const topUsuariosTiempoResult = await query(`
      SELECT u.name, u.apellido, u.rol, COALESCE(SUM(s.duracion_minutos), 0) as tiempo_total
      FROM users u
      LEFT JOIN sesiones s ON u.id = s.usuario_id
      GROUP BY u.id, u.name, u.apellido, u.rol
      ORDER BY tiempo_total DESC
      LIMIT 5
    `);
    
    res.status(200).json({
      tiempoPromedioSesion: parseFloat(tiempoPromedioResult.rows[0].promedio).toFixed(2),
      sesionesHoy: parseInt(sesionesHoyResult.rows[0].total),
      sesionesSemana: parseInt(sesionesSemanResult.rows[0].total),
      sesionesMes: parseInt(sesionesMesResult.rows[0].total),
      sesionesPorDia: sesionesPorDiaResult.rows,
      usuariosActivosPorDia: usuariosActivosPorDiaResult.rows,
      tiempoPorDia: tiempoPorDiaResult.rows,
      crecimientoUsuarios: crecimientoUsuariosResult.rows,
      citasPorMes: citasPorMesResult.rows,
      topUsuariosTiempo: topUsuariosTiempoResult.rows
    });
  } catch (error) {
    console.error('Error al obtener estadisticas de sesiones:', error);
    res.status(500).json({ error: 'Error al obtener estadisticas de sesiones' });
  }
};

// Guardar calificacion de satisfaccion
const guardarCalificacion = async (req, res) => {
  const { citaId, pacienteId, calificacion } = req.body;
  
  try {
    // Validar que la calificacion este entre 1 y 5
    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: 'La calificacion debe estar entre 1 y 5 estrellas' });
    }
    
    // Verificar que la cita existe y pertenece al paciente
    const citaResult = await query(
      'SELECT id FROM citas WHERE id = $1 AND paciente_id = $2',
      [citaId, pacienteId]
    );
    
    if (citaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    // Verificar si ya existe una calificacion para esta cita
    const existeCalificacion = await query(
      'SELECT id FROM calificaciones_satisfaccion WHERE cita_id = $1',
      [citaId]
    );
    
    if (existeCalificacion.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una calificacion para esta cita' });
    }
    
    // Insertar calificacion
    await query(
      'INSERT INTO calificaciones_satisfaccion (cita_id, paciente_id, calificacion) VALUES ($1, $2, $3)',
      [citaId, pacienteId, calificacion]
    );
    
    res.status(201).json({ message: 'Calificacion guardada exitosamente' });
  } catch (error) {
    console.error('Error al guardar calificacion:', error);
    res.status(500).json({ error: 'Error al guardar calificacion' });
  }
};

// Obtener estadisticas de satisfaccion para el asistente
const obtenerEstadisticasSatisfaccion = async (req, res) => {
  try {
    // Promedio general de calificaciones
    const promedioResult = await query(`
      SELECT 
        COALESCE(AVG(calificacion), 0) as promedio,
        COUNT(*) as total_calificaciones
      FROM calificaciones_satisfaccion
    `);
    
    // Distribucion de calificaciones (cuantas de cada estrella)
    const distribucionResult = await query(`
      SELECT 
        calificacion,
        COUNT(*) as cantidad
      FROM calificaciones_satisfaccion
      GROUP BY calificacion
      ORDER BY calificacion DESC
    `);
    
    // Calificaciones por dia (ultimos 30 dias)
    const calificacionesPorDiaResult = await query(`
      SELECT 
        DATE(created_at) as fecha,
        ROUND(AVG(calificacion), 2) as promedio_dia,
        COUNT(*) as total_dia
      FROM calificaciones_satisfaccion
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY fecha
    `);
    
    // Calificaciones por mes (ultimos 6 meses)
    const calificacionesPorMesResult = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        ROUND(AVG(calificacion), 2) as promedio_mes,
        COUNT(*) as total_mes
      FROM calificaciones_satisfaccion
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes
    `);
    
    // Tendencia: comparar promedio del mes actual vs mes anterior
    const tendenciaResult = await query(`
      SELECT 
        CASE 
          WHEN TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM') THEN 'actual'
          ELSE 'anterior'
        END as periodo,
        ROUND(AVG(calificacion), 2) as promedio
      FROM calificaciones_satisfaccion
      WHERE created_at >= NOW() - INTERVAL '2 months'
      GROUP BY CASE 
          WHEN TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM') THEN 'actual'
          ELSE 'anterior'
        END
    `);
    
    // Calcular porcentaje de aceptacion (calificaciones >= 4 estrellas)
    const aceptacionResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE calificacion >= 4) as positivas,
        COUNT(*) as total
      FROM calificaciones_satisfaccion
    `);
    
    const porcentajeAceptacion = aceptacionResult.rows[0].total > 0 
      ? ((aceptacionResult.rows[0].positivas / aceptacionResult.rows[0].total) * 100).toFixed(1)
      : 0;
    
    // Crear objeto de distribucion con valores por defecto
    const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribucionResult.rows.forEach(row => {
      distribucion[row.calificacion] = parseInt(row.cantidad);
    });
    
    res.status(200).json({
      promedioGeneral: parseFloat(promedioResult.rows[0].promedio).toFixed(2),
      totalCalificaciones: parseInt(promedioResult.rows[0].total_calificaciones),
      distribucion,
      calificacionesPorDia: calificacionesPorDiaResult.rows,
      calificacionesPorMes: calificacionesPorMesResult.rows,
      tendencia: tendenciaResult.rows,
      porcentajeAceptacion: parseFloat(porcentajeAceptacion)
    });
  } catch (error) {
    console.error('Error al obtener estadisticas de satisfaccion:', error);
    res.status(500).json({ error: 'Error al obtener estadisticas de satisfaccion' });
  }
};

module.exports = { 
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
  verificarEstadoCuenta,
  validarSoloLetras,
  validarCedula,
  validarTelefono,
  validarEmail,
  validarPassword,
  validarRol
};