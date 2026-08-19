const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const upload = require('../config/multer');
const { redirigirSiAutenticado } = require('../middlewares/auth');

// Login
router.get('/login', redirigirSiAutenticado, authController.mostrarLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post(
  '/login',
  [
    body('usuarioOCorreo').notEmpty().withMessage('El usuario o correo es obligatorio'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
  ],
  authController.login
);

// Registro cliente / delivery
router.get('/registro', redirigirSiAutenticado, authController.mostrarRegistroClienteDelivery);
router.post(
  '/registro',
  upload.single('foto'),
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').notEmpty().withMessage('El apellido es obligatorio'),
    body('telefono').notEmpty().withMessage('El teléfono es obligatorio'),
    body('correo').isEmail().withMessage('Correo inválido'),
    body('usuario').notEmpty().withMessage('El nombre de usuario es obligatorio'),
    body('rol').isIn(['cliente', 'delivery']).withMessage('Rol inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  authController.registrarClienteDelivery
);

// Registro comercio
router.get('/registro-comercio', redirigirSiAutenticado, authController.mostrarRegistroComercio);
router.post(
  '/registro-comercio',
  upload.single('logo'),
  [
    body('nombreComercio').notEmpty().withMessage('El nombre del comercio es obligatorio'),
    body('telefono').notEmpty().withMessage('El teléfono es obligatorio'),
    body('correo').isEmail().withMessage('Correo inválido'),
    body('horaApertura').notEmpty().withMessage('La hora de apertura es obligatoria'),
    body('horaCierre').notEmpty().withMessage('La hora de cierre es obligatoria'),
    body('tipoComercio').notEmpty().withMessage('Selecciona un tipo de comercio'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  authController.registrarComercio
);

// Activación de cuenta
router.get('/activar/:token', authController.activarCuenta);

// Recuperar contraseña
router.get('/olvido-password', authController.mostrarOlvidoPassword);
router.post('/olvido-password', authController.enviarTokenReset);
router.get('/reset-password/:token', authController.mostrarResetPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;

