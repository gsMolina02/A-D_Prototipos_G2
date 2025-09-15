# Despliegue del Sistema de Agendamiento de Citas Médicas

## 🚀 Opciones de Despliegue Gratuito

### Opción 1: Vercel + Supabase (Recomendada)
1. **Base de Datos**: Crear cuenta en [Supabase](https://supabase.com)
2. **Frontend**: Desplegar en [Vercel](https://vercel.com)
3. **Backend**: Vercel Serverless Functions

### Opción 2: Railway (Todo en uno)
1. Crear cuenta en [Railway](https://railway.app)
2. Conectar repositorio de GitHub
3. PostgreSQL incluido

### Opción 3: Render (Todo en uno)
1. Crear cuenta en [Render](https://render.com)
2. Conectar repositorio de GitHub
3. PostgreSQL incluido

## 📋 Pasos para Despliegue con Vercel + Supabase

### 1. Preparar Base de Datos (Supabase)
1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Ejecutar script SQL de la carpeta `Backend/db/`
4. Obtener credenciales de conexión

### 2. Variables de Entorno
Crear archivo `.env.production` en Backend:
```
DATABASE_URL=postgresql://usuario:password@host:puerto/database
JWT_SECRET=tu_jwt_secret_seguro
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_app
EMAIL_PROVIDER=gmail
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_PHONE_NUMBER=tu_numero_twilio
```

### 3. Desplegar en Vercel
1. Fork este repositorio en GitHub
2. Conectar GitHub con Vercel
3. Configurar variables de entorno en Vercel Dashboard
4. Deploy automático

### 4. Configurar CORS
Actualizar URLs de producción en `Backend/src/server.js`

## 🔧 Comandos de Construcción

### Frontend
```bash
cd Frontend
npm install
npm run build
```

### Backend
```bash
cd Backend
npm install
npm start
```

## 📱 URLs de Producción
- Frontend: `https://tu-app.vercel.app`
- API: `https://tu-app.vercel.app/api`

## 🛡️ Seguridad
- HTTPS automático
- Variables de entorno seguras
- CORS configurado
- Headers de seguridad (Helmet)

## 📞 Soporte
En caso de problemas, revisar:
1. Logs de Vercel
2. Variables de entorno
3. Conexión a base de datos
4. Configuración de CORS
