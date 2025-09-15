# 🏥 Sistema de Agendamiento de Citas Médicas

Sistema completo para gestión de citas médicas con React.js, Node.js, PostgreSQL y notificaciones por WhatsApp/Email.

## 🚀 Despliegue en Producción

### Opciones Gratuitas Recomendadas:

1. **[Vercel + Supabase](./DESPLIEGUE.md)** (Más Recomendada)
2. **[Railway](https://railway.app)** (Todo en uno)
3. **[Render](https://render.com)** (Todo en uno)

Ver [DESPLIEGUE.md](./DESPLIEGUE.md) para instrucciones detalladas.

## 🛠️ Instalación Local

### Prerrequisitos
- Node.js 18+
- PostgreSQL
- Git

### 1. Clonar repositorio
```bash
git clone https://github.com/tu-usuario/AgendamientoDeCitasMedicas.git
cd AgendamientoDeCitasMedicas
```

### 2. Configurar Backend
```bash
cd Backend
npm install
cp ../.env.example .env
# Editar .env con tus credenciales
npm start
```

### 3. Configurar Frontend
```bash
cd Frontend
npm install
npm start
```

### 4. Configurar Base de Datos
Ejecutar `database_setup.sql` en PostgreSQL

## 📱 Características

- ✅ Autenticación de usuarios (pacientes/doctores)
- ✅ Gestión de horarios médicos
- ✅ Agendamiento de citas
- ✅ Reprogramación y cancelación
- ✅ Notificaciones por WhatsApp (Twilio)
- ✅ Notificaciones por Email (Gmail/Outlook)
- ✅ Sistema de recordatorios automáticos
- ✅ Reportes y estadísticas
- ✅ Dashboard responsivo

## 🏗️ Arquitectura

- **Frontend**: React.js 19.1.0
- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL
- **Notificaciones**: Twilio (WhatsApp) + Nodemailer (Email)
- **Patrones**: MVC, Repository, Service Layer, Observer

## 📋 Scripts Disponibles

### Backend
```bash
npm start          # Iniciar servidor
npm test           # Ejecutar tests
```

### Frontend
```bash
npm start          # Servidor desarrollo
npm build          # Construir para producción
npm test           # Ejecutar tests
```

## 🔧 Variables de Entorno

Ver `.env.example` para la configuración completa.

## 📞 Soporte

Para problemas o dudas, crear un issue en GitHub.

## 📄 Licencia

MIT License