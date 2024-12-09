const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No se proporcionó un token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // Añadimos el usuario decodificado a la solicitud
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
