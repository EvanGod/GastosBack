const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const app = express.Router();
const userRoutes = require('./routes/users');
const gastosRoutes = require('./routes/gastos'); // Importar rutas de gastos
const PORT = process.env.PORT || 3000;

const verifyToken = require('./middlewares/verifyToken'); // Ruta al middleware




// Middleware
app.use(cors());
  
app.use(bodyParser.json());

// Rutas de usuarios
app.use('/api/users', userRoutes);
app.use('/api/gastos', gastosRoutes); // Rutas de gastos

// Ruta base
app.get('/', (req, res) => {
    res.send('Servidor funcionando');
});

app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'Ruta protegida', user: req.user });
  });

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

module.exports = app;