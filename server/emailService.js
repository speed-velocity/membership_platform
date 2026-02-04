const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { host, port, secure, user, pass } = config.smtp;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

function logFallback(to, subject, body) {
  const entry = `[${new Date().toISOString()}] EMAIL (SMTP not configured)\nTo: ${to}\nSubject: ${subject}\n\n${body}\n---\n`;
  fs.appendFileSync(path.join(LOG_DIR, 'emails.log'), entry);
}

async function sendEmail(to, subject, text, html) {
  const transport = getTransporter();
  if (transport) {
    try {
      await transport.sendMail({
        from: config.smtp.user,
        to,
        subject,
        text: text || html,
        html: html ? html.replace(/\n/g, '<br>') : undefined,
      });
      return true;
    } catch (err) {
      console.error('Email send error:', err.message);
      logFallback(to, subject, text || html);
      return false;
    }
  }
  logFallback(to, subject, text || html);
  return false;
}

module.exports = { sendEmail, getTransporter };
