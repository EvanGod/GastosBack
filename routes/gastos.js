const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Configuración de Multer para guardar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/assets'); // Carpeta donde se almacenarán las imágenes
  },
  filename: (req, file, cb) => {
    const gastoId = req.body.gastoId; // Usamos el ID del gasto
    cb(null, `gasto-${gastoId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

// Middleware para verificar el token y extraer el usuario ID
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token no válido' });
    }
    req.userId = decoded.id; // Guardamos el id del usuario en la petición
    next();
  });
};

// Ruta para agregar un gasto
router.post('/add', verifyToken, upload.single('imagen_recibo'), async (req, res) => {
  const { monto, descripcion, ubicacion } = req.body;
  const usuario_id = req.userId; // Usamos el ID del usuario del token

  if (!monto || !descripcion || !usuario_id) {
    return res.status(400).json({ message: 'Los campos monto, descripcion y usuario_id son requeridos' });
  }

  let imagenRecibo = null;
  if (req.file) {
    imagenRecibo = `/assets/${req.file.filename}`; // Ruta relativa de la imagen
  }

  try {
    const [result] = await db.query(
      'INSERT INTO Gastos (usuario_id, monto, descripcion, fecha, ubicacion, imagen_recibo) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario_id, monto, descripcion, new Date(), ubicacion, imagenRecibo]
    );

    res.status(201).json({ message: 'Gasto registrado con éxito', gastoId: result.insertId });
  } catch (error) {
    console.error('Error al agregar el gasto:', error);
    res.status(500).json({ message: 'Error al agregar el gasto' });
  }
});

// Ruta para obtener los gastos de un usuario
router.get('/', verifyToken, async (req, res) => {
  const usuario_id = req.userId; // Usamos el ID del usuario del token

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
