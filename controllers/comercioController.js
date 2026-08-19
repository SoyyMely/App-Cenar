const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');

// ---------- HOME (listado de pedidos del comercio) ----------

exports.home = async (req, res) => {
  const pedidos = await Pedido.find({ comercio: req.session.usuario.id })
    .populate('comercio', 'nombreComercio foto')
    .sort({ createdAt: -1 })
    .lean();

  res.render('comercio/home', { titulo: 'Mis pedidos', pedidos });
};

exports.verDetallePedido = async (req, res) => {
  const pedido = await Pedido.findOne({
    _id: req.params.id,
    comercio: req.session.usuario.id
  })
    .populate('comercio', 'nombreComercio foto')
    .lean();

  if (!pedido) return res.redirect('/comercio');

  res.render('comercio/detallePedido', { titulo: 'Detalle del pedido', pedido });
};

exports.asignarDelivery = async (req, res) => {
  const pedido = await Pedido.findOne({
    _id: req.params.id,
    comercio: req.session.usuario.id
  });

  if (!pedido || pedido.estado !== 'pendiente') {
    return res.redirect(`/comercio/pedidos/${req.params.id}`);
  }

  const deliveryDisponible = await Usuario.findOne({ rol: 'delivery', activo: true, disponible: true });

  if (!deliveryDisponible) {
    const pedidoConDatos = await Pedido.findById(req.params.id).populate('comercio', 'nombreComercio foto').lean();
    return res.render('comercio/detallePedido', {
      titulo: 'Detalle del pedido',
      pedido: pedidoConDatos,
      error: 'No hay delivery disponible en este momento, intenta más tarde.'
    });
  }

  pedido.delivery = deliveryDisponible._id;
  pedido.estado = 'en_proceso';
  await pedido.save();

  deliveryDisponible.disponible = false;
  await deliveryDisponible.save();

  res.redirect(`/comercio/pedidos/${req.params.id}`);
};

// ---------- PERFIL ----------

exports.mostrarPerfil = async (req, res) => {
  const comercio = await Usuario.findById(req.session.usuario.id).lean();
  res.render('comercio/perfil', { titulo: 'Mi perfil', comercio });
};

exports.actualizarPerfil = async (req, res) => {
  const errores = validationResult(req);
  const comercio = await Usuario.findById(req.session.usuario.id);

  if (!errores.isEmpty()) {
    return res.render('comercio/perfil', {
      titulo: 'Mi perfil',
      errores: errores.array(),
      comercio: { ...comercio.toObject(), ...req.body }
    });
  }

  const { horaApertura, horaCierre, telefono, correo } = req.body;

  comercio.horaApertura = horaApertura;
  comercio.horaCierre = horaCierre;
  comercio.telefono = telefono;
  comercio.correo = correo;
  if (req.file) {
    comercio.foto = `/uploads/${req.file.filename}`;
  }
  await comercio.save();

  res.redirect('/comercio');
};

// ---------- MANTENIMIENTO DE CATEGORÍAS ----------

exports.listarCategorias = async (req, res) => {
  const categorias = await Categoria.find({ comercio: req.session.usuario.id }).lean();

  for (const cat of categorias) {
    cat.cantidadProductos = await Producto.countDocuments({ categoria: cat._id });
  }

  res.render('comercio/categorias/listado', { titulo: 'Mis categorías', categorias });
};

exports.mostrarCrearCategoria = (req, res) => {
  res.render('comercio/categorias/crear', { titulo: 'Crear categoría' });
};

exports.crearCategoria = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.render('comercio/categorias/crear', {
      titulo: 'Crear categoría',
      errores: errores.array(),
      datos: req.body
    });
  }

  const { nombre, descripcion } = req.body;

  await Categoria.create({
    nombre,
    descripcion,
    comercio: req.session.usuario.id
  });

  res.redirect('/comercio/categorias');
};

exports.mostrarEditarCategoria = async (req, res) => {
  const categoria = await Categoria.findOne({ _id: req.params.id, comercio: req.session.usuario.id }).lean();
  if (!categoria) return res.redirect('/comercio/categorias');

  res.render('comercio/categorias/editar', { titulo: 'Editar categoría', categoria });
};

exports.editarCategoria = async (req, res) => {
  const errores = validationResult(req);
  const categoria = await Categoria.findOne({ _id: req.params.id, comercio: req.session.usuario.id });
  if (!categoria) return res.redirect('/comercio/categorias');

  if (!errores.isEmpty()) {
    return res.render('comercio/categorias/editar', {
      titulo: 'Editar categoría',
      errores: errores.array(),
      categoria: { ...categoria.toObject(), ...req.body }
    });
  }

  categoria.nombre = req.body.nombre;
  categoria.descripcion = req.body.descripcion;
  await categoria.save();

  res.redirect('/comercio/categorias');
};

exports.mostrarEliminarCategoria = async (req, res) => {
  const categoria = await Categoria.findOne({ _id: req.params.id, comercio: req.session.usuario.id });
  if (!categoria) return res.redirect('/comercio/categorias');

  res.render('comercio/categorias/eliminar', { titulo: 'Eliminar categoría', categoria });
};

exports.eliminarCategoria = async (req, res) => {
  await Producto.deleteMany({ categoria: req.params.id, comercio: req.session.usuario.id });
  await Categoria.findOneAndDelete({ _id: req.params.id, comercio: req.session.usuario.id });

  res.redirect('/comercio/categorias');
};

// ---------- MANTENIMIENTO DE PRODUCTOS ----------

exports.listarProductos = async (req, res) => {
  const productos = await Producto.find({ comercio: req.session.usuario.id })
    .populate('categoria', 'nombre')
    .lean();

  res.render('comercio/productos/listado', { titulo: 'Mis productos', productos });
};

exports.mostrarCrearProducto = async (req, res) => {
  const categorias = await Categoria.find({ comercio: req.session.usuario.id }).lean();
  res.render('comercio/productos/crear', { titulo: 'Crear producto', categorias });
};

exports.crearProducto = async (req, res) => {
  const errores = validationResult(req);
  const categorias = await Categoria.find({ comercio: req.session.usuario.id }).lean();

  if (!errores.isEmpty() || !req.file) {
    return res.render('comercio/productos/crear', {
      titulo: 'Crear producto',
      errores: errores.array().length ? errores.array() : [{ msg: 'La foto del producto es obligatoria' }],
      datos: req.body,
      categorias
    });
  }

  const { nombre, descripcion, precio, categoria } = req.body;

  await Producto.create({
    nombre,
    descripcion,
    precio,
    categoria,
    comercio: req.session.usuario.id,
    foto: `/uploads/${req.file.filename}`
  });

  res.redirect('/comercio/productos');
};

exports.mostrarEditarProducto = async (req, res) => {
  const producto = await Producto.findOne({ _id: req.params.id, comercio: req.session.usuario.id }).lean();
  if (!producto) return res.redirect('/comercio/productos');

  const categorias = await Categoria.find({ comercio: req.session.usuario.id }).lean();
  categorias.forEach(cat => {
    cat.seleccionada = cat._id.toString() === producto.categoria.toString();
  });

  res.render('comercio/productos/editar', { titulo: 'Editar producto', producto, categorias });
};

exports.editarProducto = async (req, res) => {
  const errores = validationResult(req);
  const producto = await Producto.findOne({ _id: req.params.id, comercio: req.session.usuario.id });
  if (!producto) return res.redirect('/comercio/productos');

  if (!errores.isEmpty()) {
    const categorias = await Categoria.find({ comercio: req.session.usuario.id }).lean();
    return res.render('comercio/productos/editar', {
      titulo: 'Editar producto',
      errores: errores.array(),
      producto: { ...producto.toObject(), ...req.body },
      categorias
    });
  }

  const { nombre, descripcion, precio, categoria } = req.body;

  producto.nombre = nombre;
  producto.descripcion = descripcion;
  producto.precio = precio;
  producto.categoria = categoria;
  if (req.file) {
    producto.foto = `/uploads/${req.file.filename}`;
  }
  await producto.save();

  res.redirect('/comercio/productos');
};

exports.mostrarEliminarProducto = async (req, res) => {
  const producto = await Producto.findOne({ _id: req.params.id, comercio: req.session.usuario.id }).lean();
  if (!producto) return res.redirect('/comercio/productos');

  res.render('comercio/productos/eliminar', { titulo: 'Eliminar producto', producto });
};

exports.eliminarProducto = async (req, res) => {
  await Producto.findOneAndDelete({ _id: req.params.id, comercio: req.session.usuario.id });
  res.redirect('/comercio/productos');
};