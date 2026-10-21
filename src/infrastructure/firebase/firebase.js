const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { firebase } = require('../config/env');

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: firebase.projectId,
        clientEmail: firebase.clientEmail,
        privateKey: firebase.privateKey,
      }),
    });

const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { db, auth };
