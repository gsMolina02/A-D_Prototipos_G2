const express = require('express');
const cors = require('cors'); // Solo una vez
const dotenv = require('dotenv');
const helmet = require('helmet');
const userRoutes = require('./routes/userRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const citaRoutes = require('./routes/citaRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const citasRoutes = require('./routes/citas');
const emailRoutes = require('./routes/emailRoutes'); // Rutas de email independientes
const whatsappRoutes = require('./routes/whatsappRoutes'); // Rutas de WhatsApp independientes

dotenv.config();

const app = express();

// Configurar CORS para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-app.vercel.app', 'https://*.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Permitir que Express reciba datos JSON
app.use(express.json());

// Usar Helmet para seguridad con configuración para Vercel
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para Vercel
  crossOriginEmbedderPolicy: false
}));

// Middleware para registrar todas las solicitudes entrantes (comentado para reducir logs)
// app.use((req, res, next) => {
//   console.log(`Solicitud entrante: ${req.method} ${req.url}`);
//   next();
// });

// Definir las rutas de la API, asegurándote de usar el prefijo "/api"
app.use('/api', userRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/citasreportes', citasRoutes);
app.use('/api/emails', emailRoutes); // Sistema de emails independiente
app.use('/api/whatsapp', whatsappRoutes); // Sistema de WhatsApp independiente

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

// Para Vercel, exportar la app sin listen
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    
    // Inicializar sistema de recordatorios solo en desarrollo
    inicializarRecordatorios();
  });
}

// Exportar para Vercel
module.exports = app;

// Sistema de recordatorios automático
function inicializarRecordatorios() {
  const { enviarRecordatoriosCitas } = require('./controllers/citaController');
  
  // Ejecutar inmediatamente al iniciar el servidor
  enviarRecordatoriosCitas();
  
  // Ejecutar cada hora (3600000 ms = 1 hora)
  setInterval(async () => {
    await enviarRecordatoriosCitas();
  }, 3600000); // 1 hora
}