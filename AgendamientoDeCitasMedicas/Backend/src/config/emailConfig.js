// Configuración alternativa para Gmail con OAuth2
const createGmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: process.env.GMAIL_ACCESS_TOKEN
    }
  });
};

// Configuración simple para Outlook
const createOutlookTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });
};

// Configuración para otros proveedores
const createCustomTransporter = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'outlook';
  
  switch (emailProvider.toLowerCase()) {
    case 'gmail':
      return createGmailTransporter();
    case 'outlook':
    case 'hotmail':
      return createOutlookTransporter();
    default:
      return createOutlookTransporter(); // Por defecto usar Outlook
  }
};
