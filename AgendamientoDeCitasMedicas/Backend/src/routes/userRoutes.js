const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../controllers/userController'); // Asegúrate de que los controladores existan

// Ruta para login
router.post('/login', loginUser);

// Ruta para registro
router.post('/register', registerUser);

module.exports = router;
