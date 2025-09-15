CONFIGURACIÓN REQUERIDA EN VERCEL DASHBOARD:

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: agendamiento-de-citas-medicas
3. Ve a Settings > Environment Variables
4. Agrega las siguientes variables:

=== VARIABLES DE ENTORNO OBLIGATORIAS ===

DATABASE_URL=postgresql://postgres.acrbelbjgcokhjfrsrpq:XC%25FmEgSzNZf8B7@aws-1-sa-east-1.pooler.supabase.com:6543/postgres

PORT=5000

JWT_SECRET=rootroot

EMAIL_USER=axeldoge4@gmail.com

EMAIL_PASSWORD=cmgo xbpn ente sqva

EMAIL_PROVIDER=gmail

TWILIO_ACCOUNT_SID=ACd77645c819b2accc30431f0aeae0229c

TWILIO_AUTH_TOKEN=ae52a106312427d949673ebef22366c3

TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

WHATSAPP_PROVIDER=twilio

NODE_ENV=production

DISABLE_ESLINT_PLUGIN=true

ESLINT_NO_DEV_ERRORS=true

GENERATE_SOURCEMAP=false

CI=false

=== INSTRUCCIONES ===

1. IMPORTANTE: Cada variable debe agregarse por separado en Vercel
2. Aplica para: Production, Preview, Development (marca todas)
3. Después de agregar todas las variables, haz un nuevo deployment
4. Ve a la pestaña "Deployments" y haz "Redeploy"

=== CREDENCIALES DE ACCESO ===

Doctor: axeldoge4@gmail.com / doctor123
Paciente: juan.perez@email.com / 123456
