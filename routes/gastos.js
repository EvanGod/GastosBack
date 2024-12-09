const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const admin = require('firebase-admin'); // Importa Firebase Admin SDK

// Ruta para agregar un gasto (sin imagen)
router.post('/add', verifyToken, async (req, res) => {
  const { monto, descripcion, ubicacion, userToken } = req.body; // El frontend debe enviar userToken
  const usuario_id = req.user.id; // ID del usuario obtenido del token

  if (!monto || !descripcion) {
    return res.status(400).json({ message: 'Los campos monto y descripcion son requeridos' });
  }

  try {
    // Guarda el gasto en la base de datos
    const [result] = await db.query(
      'INSERT INTO Gastos (usuario_id, monto, descripcion, fecha, ubicacion) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, monto, descripcion, new Date(), ubicacion]
    );

    // Enviar notificación push
    if (userToken) {
      const message = {
        notification: {
          title: '¡Nuevo gasto registrado!',
          body: `Has registrado un gasto de $${monto} en "${descripcion}".`,
        },
        token: userToken, // Token del dispositivo del usuario
      };

      await admin.messaging().send(message);
      console.log('Notificación enviada');
    }

    res.status(201).json({ message: 'Gasto registrado con éxito', gastoId: result.insertId });
  } catch (error) {
    console.error('Error al agregar el gasto:', error);
    res.status(500).json({ message: 'Error al agregar el gasto' });
  }
});

// Ruta para obtener los gastos del usuario
router.get('/', verifyToken, async (req, res) => {
  const usuario_id = req.user.id; // ID del usuario obtenido del token

  try {
    const [gastos] = await db.query(
      'SELECT id, monto, descripcion, fecha, ubicacion, imagen_recibo FROM Gastos WHERE usuario_id = ?',
      [usuario_id]
    );

    res.status(200).json(gastos);
  } catch (error) {
    console.error('Error al obtener los gastos:', error);
    res.status(500).json({ message: 'Error al obtener los gastos' });
  }
});

module.exports = router;
