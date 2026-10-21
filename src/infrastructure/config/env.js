require('dotenv').config();

const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];

const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Variáveis de ambiente ausentes no .env: ${missing.join(', ')}`);
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
};
