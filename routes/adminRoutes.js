const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const adminController = require('../controllers/adminController');
const upload = require('../config/multer');
const { estaAutenticado, tieneRol } = require('../middlewares/auth');

// Todas las rutas de admin requieren sesión activa Y rol administrador
router.use(estaAutenticado, tieneRol('administrador'));

router.get('/', adminController.home);

// Tipos de comercio
router.get('/tipos-comercio', adminController.listarTiposComercio);
router.get('/tipos-comercio/crear', adminController.mostrarCrearTipoComercio);
router.post(
  '/tipos-comercio/crear',
  upload.single('icono'),
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria')
  ],
  adminController.crearTipoComercio
);
router.get('/tipos-comercio/:id/editar', adminController.mostrarEditarTipoComercio);
router.post(
  '/tipos-comercio/:id/editar',
  upload.single('icono'),
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria')
  ],
  adminController.editarTipoComercio
);
router.get('/tipos-comercio/:id/eliminar', adminController.mostrarEliminarTipoComercio);
router.post('/tipos-comercio/:id/eliminar', adminController.eliminarTipoComercio);

// Configuración
router.get('/configuracion', adminController.mostrarConfiguracion);
router.get('/configuracion/editar', adminController.mostrarEditarConfiguracion);
router.post(
  '/configuracion/editar',
  [body('itbis').isFloat({ min: 0 }).withMessage('El ITBIS debe ser un número válido')],
  adminController.editarConfiguracion
);

module.exports = router;

// Clientes
router.get('/clientes', adminController.listarClientes);
router.post('/clientes/:id/cambiar-estado', adminController.cambiarEstadoCliente);

// Delivery
router.get('/delivery', adminController.listarDelivery);
router.post('/delivery/:id/cambiar-estado', adminController.cambiarEstadoDelivery);

// Comercios
router.get('/comercios', adminController.listarComercios);
router.post('/comercios/:id/cambiar-estado', adminController.cambiarEstadoComercio);

// Administradores
router.get('/administradores', adminController.listarAdministradores);
router.get('/administradores/crear', adminController.mostrarCrearAdministrador);
router.post(
  '/administradores/crear',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').notEmpty().withMessage('El apellido es obligatorio'),
    body('cedula').notEmpty().withMessage('La cédula es obligatoria'),
    body('correo').isEmail().withMessage('Correo inválido'),
    body('usuario').notEmpty().withMessage('El usuario es obligatorio'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  adminController.crearAdministrador
);
router.get('/administradores/:id/editar', adminController.mostrarEditarAdministrador);
router.post(
  '/administradores/:id/editar',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').notEmpty().withMessage('El apellido es obligatorio'),
    body('cedula').notEmpty().withMessage('La cédula es obligatoria'),
    body('correo').isEmail().withMessage('Correo inválido'),
    body('usuario').notEmpty().withMessage('El usuario es obligatorio')
  ],
  adminController.editarAdministrador
);
router.get('/administradores/:id/cambiar-estado', adminController.mostrarActivarInactivarAdmin);
router.post('/administradores/:id/cambiar-estado', adminController.cambiarEstadoAdministrador);