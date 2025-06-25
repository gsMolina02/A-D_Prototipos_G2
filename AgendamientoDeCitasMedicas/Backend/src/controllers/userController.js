// userController.js
const { query } = require('../db/db'); // Asegúrate de que esta ruta sea correcta


const loginUser = async (req, res) => {
  const { email, password } = req.body; // Asegúrate de que los datos se reciban correctamente

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Aquí deberías validar la contraseña (asegurándote de comparar la contraseña encriptada si es necesario)
    if (password === user.password) {
      res.status(200).json({ message: 'Login exitoso', user });
    } else {
      res.status(400).json({ error: 'Contraseña incorrecta' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};
// Función para registro
const registerUser = async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    const result = await query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, password]);
    return res.status(201).json({ message: 'Usuario registrado', user: result.rows[0] });
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { loginUser, registerUser };
