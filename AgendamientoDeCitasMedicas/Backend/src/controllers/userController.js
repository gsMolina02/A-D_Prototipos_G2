// userController.js
const { query } = require('../db/db'); // Asegúrate de que esta ruta sea correcta


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
    const result = await query(
      'INSERT INTO users (name, apellido, cedula, email, telefono, password, rol) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, apellido, cedula, email, telefono, password, rol]
    );
    return res.status(201).json({ message: 'User registered', user: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { loginUser, registerUser };
