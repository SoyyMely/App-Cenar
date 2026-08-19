const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const comercioController = require('../controllers/comercioController');
const upload = require('../config/multer');
const { estaAutenticado, tieneRol } = require('../middlewares/auth');

router.use(estaAutenticado, tieneRol('comercio'));

// Home
router.get('/', comercioController.home);
router.get('/pedidos/:id', comercioController.verDetallePedido);
router.post('/pedidos/:id/asignar-delivery', comercioController.asignarDelivery);

// Perfil
router.get('/perfil', comercioController.mostrarPerfil);
router.post(
  '/perfil',
  upload.single('logo'),
  [
    body('horaApertura').notEmpty().withMessage('La hora de apertura es obligatoria'),
    body('horaCierre').notEmpty().withMessage('La hora de cierre es obligatoria'),
    body('telefono').notEmpty().withMessage('El teléfono es obligatorio'),
    body('correo').isEmail().withMessage('Correo inválido')
  ],
  comercioController.actualizarPerfil
);

// Categorías
router.get('/categorias', comercioController.listarCategorias);
router.get('/categorias/crear', comercioController.mostrarCrearCategoria);
router.post(
  '/categorias/crear',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria')
  ],
  comercioController.crearCategoria
);
router.get('/categorias/:id/editar', comercioController.mostrarEditarCategoria);
router.post(
  '/categorias/:id/editar',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria')
  ],
  comercioController.editarCategoria
);
router.get('/categorias/:id/eliminar', comercioController.mostrarEliminarCategoria);
router.post('/categorias/:id/eliminar', comercioController.eliminarCategoria);

// Productos
router.get('/productos', comercioController.listarProductos);
router.get('/productos/crear', comercioController.mostrarCrearProducto);
router.post(
  '/productos/crear',
  upload.single('foto'),
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria'),
    body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número válido'),
    body('categoria').notEmpty().withMessage('Selecciona una categoría')
  ],
  comercioController.crearProducto
);
router.get('/productos/:id/editar', comercioController.mostrarEditarProducto);
router.post(
  '/productos/:id/editar',
  upload.single('foto'),
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria'),
    body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número válido'),
    body('categoria').notEmpty().withMessage('Selecciona una categoría')
  ],
  comercioController.editarProducto
);
router.get('/productos/:id/eliminar', comercioController.mostrarEliminarProducto);
router.post('/productos/:id/eliminar', comercioController.eliminarProducto);

module.exports = router;