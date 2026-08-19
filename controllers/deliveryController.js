const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');

// ---------- HOME (pedidos asignados) ----------

exports.home = async (req, res) => {
  const pedidos = await Pedido.find({
    delivery: req.session.usuario.id,
    estado: { $in: ['en_proceso', 'completado'] }
  })
    .populate('comercio', 'nombreComercio foto')
    .sort({ createdAt: -1 })
    .lean();

  res.render('delivery/home', { titulo: 'Mis entregas', pedidos });
};

exports.verDetallePedido = async (req, res) => {
  const pedido = await Pedido.findOne({ _id: req.params.id, delivery: req.session.usuario.id })
    .populate('comercio', 'nombreComercio foto')
    .populate('direccion')
    .lean();

  if (!pedido) return res.redirect('/delivery');

  res.render('delivery/detallePedido', { titulo: 'Detalle del pedido', pedido });
};

exports.completarPedido = async (req, res) => {
  const pedido = await Pedido.findOne({ _id: req.params.id, delivery: req.session.usuario.id });

  if (!pedido || pedido.estado !== 'en_proceso') {
    return res.redirect(`/delivery/pedidos/${req.params.id}`);
  }

  pedido.estado = 'completado';
  await pedido.save();

  const delivery = await Usuario.findById(req.session.usuario.id);
  delivery.disponible = true;
  await delivery.save();

  res.redirect(`/delivery/pedidos/${req.params.id}`);
};

// ---------- MI PERFIL ----------

exports.mostrarPerfil = async (req, res) => {
  const delivery = await Usuario.findById(req.session.usuario.id).lean();
  res.render('delivery/perfil', { titulo: 'Mi perfil', delivery });
};

exports.actualizarPerfil = async (req, res) => {
  const errores = validationResult(req);
  const delivery = await Usuario.findById(req.session.usuario.id);

  if (!errores.isEmpty()) {
    return res.render('delivery/perfil', {
      titulo: 'Mi perfil',
      errores: errores.array(),
      delivery: { ...delivery.toObject(), ...req.body }
    });
  }

  const { nombre, apellido, telefono } = req.body;
  delivery.nombre = nombre;
  delivery.apellido = apellido;
  delivery.telefono = telefono;
  if (req.file) {
    delivery.foto = `/uploads/${req.file.filename}`;
  }
  await delivery.save();

  res.redirect('/delivery');
};