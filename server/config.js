require('dotenv').config();

module.exports = {
  adminEmail: process.env.ADMIN_EMAIL || 'admin@platform.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  notificationEmail: process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@platform.com',
  appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  showResetLink: process.env.SHOW_RESET_LINK === 'true',
  showOtp: process.env.SHOW_OTP === 'true',
};
