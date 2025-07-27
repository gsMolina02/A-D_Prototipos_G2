// userController.js
const { query } = require('../db/db'); // Asegúrate de que esta ruta sea correcta

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
  const rolesValidos = ['paciente', 'doctor'];
  return rolesValidos.includes(rol);
};


// ...existing code...
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (password.trim() === user.password.trim()) {
      res.status(200).json({ message: 'Login successful', user });
    } else {
      res.status(400).json({ error: 'Incorrect password' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
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
      return res.status(400).json({ error: 'El rol debe ser "paciente" o "doctor"' });
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

    // Insertar usuario - usar 'name' que es el campo correcto en la BD
    const result = await query(
      'INSERT INTO users (name, apellido, cedula, email, telefono, password, rol) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, apellido, cedula, email, telefono, rol',
      [name.trim(), apellido.trim(), cedula, email.trim(), telefono, password, rol]
    );

    console.log('📋 Usuario registrado exitosamente:', {
      id: result.rows[0].id,
      nombre: result.rows[0].name,
      cedula: result.rows[0].cedula
    });

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

module.exports = { 
  loginUser, 
  registerUser,
  validarSoloLetras,
  validarCedula,
  validarTelefono,
  validarEmail,
  validarPassword,
  validarRol
};
