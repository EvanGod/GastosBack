const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();
require('dotenv').config();


// Expresión regular para validar el correo
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
// Expresión regular para validar la contraseña (mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

const jwtSecret = process.env.JWT_SECRET; // Cargar desde .env

// Ruta de Registro de Usuario
router.post('/register', (req, res) => {
    const { nombre, email, password, confirmPassword } = req.body;

    // Validación de campos vacíos
    if (!nombre || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validación de formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'El correo electrónico no es válido' });
    }

    // Validación de formato de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número' });
    }

    // Validación de que las contraseñas coincidan
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    // Verificar si el nombre ya existe en la base de datos
    const checkQuery = 'SELECT * FROM Usuarios WHERE nombre = ?';
    db.query(checkQuery, [nombre], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al verificar el nombre de usuario' });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

        // Verificar si el correo ya está registrado
        const emailQuery = 'SELECT * FROM Usuarios WHERE email = ?';
        db.query(emailQuery, [email], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error al verificar el correo' });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
            }

            // Encriptar la contraseña
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al encriptar la contraseña' });
                }

                // Insertar el nuevo usuario en la base de datos
                const insertQuery = 'INSERT INTO Usuarios (nombre, email, password) VALUES (?, ?, ?)';
                db.query(insertQuery, [nombre, email, hashedPassword], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error al registrar el usuario' });
                    }
                    res.status(201).json({ message: 'Usuario registrado con éxito' });
                });
            });
        });
    });
});

// Ruta de Inicio de sesión (Login)
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validación de campos vacíos
    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Buscar el usuario en la base de datos
    const query = 'SELECT * FROM Usuarios WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al consultar la base de datos' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Comparar las contraseñas
        bcrypt.compare(password, results[0].password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(400).json({ message: 'Contraseña incorrecta' });
            }

            // Crear JWT en la ruta de login
            const token = jwt.sign(
                { id: results[0].id, email: results[0].email },
                jwtSecret,  // Usamos la clave secreta desde .env
                { expiresIn: '1h' }
            );

            // Enviar la respuesta con el token
            res.status(200).json({ message: 'Inicio de sesión exitoso', token });
        });
    });
});

module.exports = router;
