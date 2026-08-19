const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const clienteController = require('../controllers/clienteController');
const upload = require('../config/multer');
const { estaAutenticado, tieneRol } = require('../middlewares/auth');

router.use(estaAutenticado, tieneRol('cliente'));

// Home y comercios
router.get('/', clienteController.home);
router.get('/tipos/:tipoId/comercios', clienteController.listarComercios);
router.post('/comercios/:comercioId/favorito', clienteController.marcarFavorito);

// Catálogo y carrito
router.get('/comercios/:comercioId/catalogo', clienteController.verCatalogo);
router.post('/comercios/:comercioId/catalogo/:productoId/agregar', clienteController.agregarAlCarrito);
router.post('/comercios/:comercioId/catalogo/:productoId/quitar', clienteController.quitarDelCarrito);

// Checkout
router.get('/comercios/:comercioId/checkout', clienteController.mostrarCheckout);
router.post('/comercios/:comercioId/pedir', clienteController.crearPedido);

// Perfil
router.get('/perfil', clienteController.mostrarPerfil);
router.post(
  '/perfil',
  upload.single('foto'),
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').notEmpty().withMessage('El apellido es obligatorio'),
    body('telefono').notEmpty().withMessage('El teléfono es obligatorio')
  ],
  clienteController.actualizarPerfil
);

// Pedidos
router.get('/pedidos', clienteController.misPedidos);
router.get('/pedidos/:id', clienteController.verDetallePedido);

// Direcciones
router.get('/direcciones', clienteController.listarDirecciones);
router.get('/direcciones/crear', clienteController.mostrarCrearDireccion);
router.post(
  '/direcciones/crear',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria')
  ],
  clienteController.crearDireccion
);
router.get('/direcciones/:id/editar', clienteController.mostrarEditarDireccion);
router.post(
  '/direcciones/:id/editar',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria')
  ],
  clienteController.editarDireccion
);
router.get('/direcciones/:id/eliminar', clienteController.mostrarEliminarDireccion);
router.post('/direcciones/:id/eliminar', clienteController.eliminarDireccion);

// Favoritos
router.get('/favoritos', clienteController.misFavoritos);
router.post('/favoritos/:comercioId/remover', clienteController.removerFavorito);

module.exports = router;