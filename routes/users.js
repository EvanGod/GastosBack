const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

// Expresiones regulares para validaciones
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

// Ruta de Registro de Usuario
router.post('/register', async (req, res) => {
    const { nombre, email, password, confirmPassword } = req.body;

    // Validación de campos vacíos
    if (!nombre || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validación de formato de email
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'El correo electrónico no es válido' });
    }

    // Validación de formato de contraseña
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número' });
    }

    // Validación de que las contraseñas coincidan
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    try {
        // Verificar si el nombre ya existe
        const [existingUser] = await db.query('SELECT * FROM Usuarios WHERE nombre = ?', [nombre]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

        // Verificar si el correo ya está registrado
        const [existingEmail] = await db.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario en la base de datos
        await db.query('INSERT INTO Usuarios (nombre, email, password) VALUES (?, ?, ?)', [nombre, email, hashedPassword]);

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (err) {
        console.error('Error en el registro:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta de Inicio de sesión (Login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validación de campos vacíos
    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        // Buscar el usuario en la base de datos
        const [results] = await db.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = results[0];

        // Comparar las contraseñas
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        // Crear JWT
        const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '1h' });

        // Enviar la respuesta con el token
        res.status(200).json({ message: 'Inicio de sesión exitoso', token });
    } catch (err) {
        console.error('Error en el inicio de sesión:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router;
