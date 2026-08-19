const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const deliveryController = require('../controllers/deliveryController');
const upload = require('../config/multer');
const { estaAutenticado, tieneRol } = require('../middlewares/auth');

router.use(estaAutenticado, tieneRol('delivery'));

router.get('/', deliveryController.home);
router.get('/pedidos/:id', deliveryController.verDetallePedido);
router.post('/pedidos/:id/completar', deliveryController.completarPedido);

router.get('/perfil', deliveryController.mostrarPerfil);
router.post(
  '/perfil',
  upload.single('foto'),
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').notEmpty().withMessage('El apellido es obligatorio'),
    body('telefono').notEmpty().withMessage('El teléfono es obligatorio')
  ],
  deliveryController.actualizarPerfil
);

module.exports = router;