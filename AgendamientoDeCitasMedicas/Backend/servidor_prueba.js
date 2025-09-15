const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!' });
});

// Ruta de login simplificada
app.post('/api/login', (req, res) => {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;
    
    if (email === 'axeldoge4@gmail.com' && password === 'doctor123') {
        res.json({ 
            message: 'Login successful', 
            user: { id: 1, name: 'Dr. Axel', rol: 'doctor' } 
        });
    } else {
        res.status(400).json({ error: 'Credenciales incorrectas' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor de prueba funcionando en puerto ${PORT}`);
    console.log(`✅ Escuchando en http://0.0.0.0:${PORT}`);
});

// Manejar errores
process.on('uncaughtException', (err) => {
    console.error('❌ Error no manejado:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Promesa rechazada:', err);
});
