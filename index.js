const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const app = express.Router();
const userRoutes = require('./routes/users');
const gastosRoutes = require('./routes/gastos'); // Importar rutas de gastos
const PORT = process.env.PORT || 3000;

const verifyToken = require('./middlewares/verifyToken'); // Ruta al middleware
const admin = require('firebase-admin'); // Importar Firebase Admin SDK

// Inicializar Firebase Admin SDK
const serviceAccount = require('./firebase-admin-sdk.json'); // Asegúrate de que la ruta sea correcta

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rutas de usuarios y gastos
app.use('/api/users', userRoutes);
app.use('/api/gastos', gastosRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

// Ruta protegida de ejemplo
app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Ruta protegida', user: req.user });
});

// Ruta para verificar la base de datos
app.get('/api/test-db', (req, res) => {
  db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      res.status(500).send('Error en la base de datos');
    } else {
      res.json({ result: results[0].result });
    }
  });
});

// Ruta para enviar una notificación de prueba
app.post('/api/send-notification', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ message: 'Token, título y cuerpo son requeridos' });
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  try {
    await admin.messaging().send(message);
    res.status(200).json({ message: 'Notificación enviada con éxito' });
  } catch (error) {
    console.error('Error al enviar la notificación:', error);
    res.status(500).json({ message: 'Error al enviar la notificación' });
  }
});

module.exports = app;
