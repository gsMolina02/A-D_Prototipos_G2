const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const userRoutes = require('./routes/userRoutes'); // Ruta correcta

dotenv.config();

const app = express();

// Habilitar CORS
app.use(cors());

// Permitir que Express reciba datos JSON
app.use(express.json());

// Usar Helmet para seguridad
app.use(helmet());

// Definir las rutas de la API, asegurándote de usar el prefijo "/api"
app.use('/api', userRoutes);

// Agregar ruta base para verificar que el backend está funcionando
app.get('/', (req, res) => {
  res.send('Bienvenido al backend');
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Configurar el puerto del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
