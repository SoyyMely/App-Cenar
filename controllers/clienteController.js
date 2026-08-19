const Usuario = require('../models/Usuario');
const TipoComercio = require('../models/TipoComercio');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const Direccion = require('../models/Direccion');
const Pedido = require('../models/Pedido');
const Configuracion = require('../models/Configuracion');
const { validationResult } = require('express-validator');

// ---------- HOME (tipos de comercio) ----------

exports.home = async (req, res) => {
  const tipos = await TipoComercio.find().lean();
  res.render('cliente/home', { titulo: 'AppCenar', tipos });
};

// ---------- LISTADO DE COMERCIOS ----------

exports.listarComercios = async (req, res) => {
  const { tipoId } = req.params;
  const { buscar } = req.query;

  const tipo = await TipoComercio.find({ _id: tipoId }).lean();

  const filtro = { rol: 'comercio', activo: true, tipoComercio: tipoId };
  if (buscar) {
    filtro.nombreComercio = { $regex: buscar, $options: 'i' };
  }

  const comercios = await Usuario.find(filtro).lean();
  const cliente = await Usuario.findById(req.session.usuario.id).lean();
  const favoritos = (cliente.favoritos || []).map(id => id.toString());

  comercios.forEach(c => {
    c.esFavorito = favoritos.includes(c._id.toString());
  });

  res.render('cliente/comercios', {
    titulo: 'Comercios',
    comercios,
    tipoId,
    buscar: buscar || '',
    cantidad: comercios.length
  });
};

exports.marcarFavorito = async (req, res) => {
  const { comercioId } = req.params;
  const cliente = await Usuario.findById(req.session.usuario.id);

  const yaEsFavorito = cliente.favoritos.some(id => id.toString() === comercioId);
  if (yaEsFavorito) {
    cliente.favoritos = cliente.favoritos.filter(id => id.toString() !== comercioId);
  } else {
    cliente.favoritos.push(comercioId);
  }
  await cliente.save();

  res.redirect(req.get('referer') || '/cliente');
};

// ---------- CATÁLOGO DE PRODUCTOS Y CARRITO ----------

exports.verCatalogo = async (req, res) => {
  const { comercioId } = req.params;

  const comercio = await Usuario.findOne({ _id: comercioId, rol: 'comercio' }).lean();
  if (!comercio) return res.redirect('/cliente');

  const categorias = await Categoria.find({ comercio: comercioId }).lean();
  const productos = await Producto.find({ comercio: comercioId }).lean();

  // Si cambiamos de comercio, reiniciamos el carrito
  if (!req.session.carrito || req.session.carrito.comercioId !== comercioId) {
    req.session.carrito = { comercioId, productos: [] };
  }

  const idsEnCarrito = req.session.carrito.productos.map(p => p.producto.toString());

  // Agrupar productos por categoría
  const categoriasConProductos = categorias.map(cat => ({
    ...cat,
    productos: productos
      .filter(p => p.categoria.toString() === cat._id.toString())
      .map(p => ({ ...p, enCarrito: idsEnCarrito.includes(p._id.toString()) }))
  }));

  const subtotal = req.session.carrito.productos.reduce((acc, p) => acc + p.precio, 0);

  res.render('cliente/catalogo', {
    titulo: comercio.nombreComercio,
    comercio,
    categoriasConProductos,
    carrito: req.session.carrito.productos,
    subtotal
  });
};

exports.agregarAlCarrito = async (req, res) => {
  const { comercioId, productoId } = req.params;

  const producto = await Producto.findOne({ _id: productoId, comercio: comercioId }).lean();
  if (!producto) return res.redirect(`/cliente/comercios/${comercioId}/catalogo`);

  if (!req.session.carrito || req.session.carrito.comercioId !== comercioId) {
    req.session.carrito = { comercioId, productos: [] };
  }

  const yaEsta = req.session.carrito.productos.some(p => p.producto.toString() === productoId);
  if (!yaEsta) {
    req.session.carrito.productos.push({
      producto: producto._id,
      nombre: producto.nombre,
      precio: producto.precio
    });
  }

  res.redirect(`/cliente/comercios/${comercioId}/catalogo`);
};

exports.quitarDelCarrito = async (req, res) => {
  const { comercioId, productoId } = req.params;

  if (req.session.carrito && req.session.carrito.comercioId === comercioId) {
    req.session.carrito.productos = req.session.carrito.productos.filter(
      p => p.producto.toString() !== productoId
    );
  }

  res.redirect(`/cliente/comercios/${comercioId}/catalogo`);
};

// ---------- CHECKOUT: ELEGIR DIRECCIÓN Y CREAR PEDIDO ----------

exports.mostrarCheckout = async (req, res) => {
  const { comercioId } = req.params;

  if (!req.session.carrito || req.session.carrito.comercioId !== comercioId || req.session.carrito.productos.length === 0) {
    return res.redirect(`/cliente/comercios/${comercioId}/catalogo`);
  }

  const comercio = await Usuario.findById(comercioId).lean();
  const direcciones = await Direccion.find({ cliente: req.session.usuario.id }).lean();

  const config = await Configuracion.findOne().lean();
  const itbisPorcentaje = config ? config.itbis : 18;

  const subtotal = req.session.carrito.productos.reduce((acc, p) => acc + p.precio, 0);
  const itbisMonto = subtotal * (itbisPorcentaje / 100);
  const total = subtotal + itbisMonto;

  res.render('cliente/checkout', {
    titulo: 'Confirmar pedido',
    comercio,
    direcciones,
    subtotal,
    itbisPorcentaje,
    itbisMonto: itbisMonto.toFixed(2),
    total: total.toFixed(2)
  });
};

exports.crearPedido = async (req, res) => {
  const { comercioId } = req.params;
  const { direccionId } = req.body;

  if (!req.session.carrito || req.session.carrito.comercioId !== comercioId || req.session.carrito.productos.length === 0) {
    return res.redirect(`/cliente/comercios/${comercioId}/catalogo`);
  }
  if (!direccionId) {
    return res.redirect(`/cliente/comercios/${comercioId}/checkout`);
  }

  const config = await Configuracion.findOne().lean();
  const itbisPorcentaje = config ? config.itbis : 18;

  const subtotal = req.session.carrito.productos.reduce((acc, p) => acc + p.precio, 0);
  const itbisMonto = subtotal * (itbisPorcentaje / 100);
  const total = subtotal + itbisMonto;

  await Pedido.create({
    cliente: req.session.usuario.id,
    comercio: comercioId,
    direccion: direccionId,
    productos: req.session.carrito.productos,
    subtotal,
    itbis: itbisPorcentaje,
    total,
    estado: 'pendiente'
  });

  // Vaciar el carrito de este comercio
  delete req.session.carrito;

  res.redirect('/cliente');
};

// ---------- MI PERFIL ----------

exports.mostrarPerfil = async (req, res) => {
  const cliente = await Usuario.findById(req.session.usuario.id).lean();
  res.render('cliente/perfil', { titulo: 'Mi perfil', cliente });
};

exports.actualizarPerfil = async (req, res) => {
  const errores = validationResult(req);
  const cliente = await Usuario.findById(req.session.usuario.id);

  if (!errores.isEmpty()) {
    return res.render('cliente/perfil', {
      titulo: 'Mi perfil',
      errores: errores.array(),
      cliente: { ...cliente.toObject(), ...req.body }
    });
  }

  const { nombre, apellido, telefono } = req.body;
  cliente.nombre = nombre;
  cliente.apellido = apellido;
  cliente.telefono = telefono;
  if (req.file) {
    cliente.foto = `/uploads/${req.file.filename}`;
  }
  await cliente.save();

  res.redirect('/cliente');
};

// ---------- MIS PEDIDOS ----------

exports.misPedidos = async (req, res) => {
  const pedidos = await Pedido.find({ cliente: req.session.usuario.id })
    .populate('comercio', 'nombreComercio foto')
    .sort({ createdAt: -1 })
    .lean();

  res.render('cliente/pedidos/listado', { titulo: 'Mis pedidos', pedidos });
};

exports.verDetallePedido = async (req, res) => {
  const pedido = await Pedido.findOne({ _id: req.params.id, cliente: req.session.usuario.id })
    .populate('comercio', 'nombreComercio foto')
    .lean();

  if (!pedido) return res.redirect('/cliente/pedidos');

  res.render('cliente/pedidos/detalle', { titulo: 'Detalle del pedido', pedido });
};

// ---------- MIS DIRECCIONES ----------

exports.listarDirecciones = async (req, res) => {
  const direcciones = await Direccion.find({ cliente: req.session.usuario.id }).lean();
  res.render('cliente/direcciones/listado', { titulo: 'Mis direcciones', direcciones });
};

exports.mostrarCrearDireccion = (req, res) => {
  res.render('cliente/direcciones/crear', { titulo: 'Nueva dirección' });
};

exports.crearDireccion = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.render('cliente/direcciones/crear', {
      titulo: 'Nueva dirección',
      errores: errores.array(),
      datos: req.body
    });
  }

  const { nombre, descripcion } = req.body;
  await Direccion.create({ nombre, descripcion, cliente: req.session.usuario.id });

  res.redirect('/cliente/direcciones');
};

exports.mostrarEditarDireccion = async (req, res) => {
  const direccion = await Direccion.findOne({ _id: req.params.id, cliente: req.session.usuario.id }).lean();
  if (!direccion) return res.redirect('/cliente/direcciones');

  res.render('cliente/direcciones/editar', { titulo: 'Editar dirección', direccion });
};

exports.editarDireccion = async (req, res) => {
  const errores = validationResult(req);
  const direccion = await Direccion.findOne({ _id: req.params.id, cliente: req.session.usuario.id });
  if (!direccion) return res.redirect('/cliente/direcciones');

  if (!errores.isEmpty()) {
    return res.render('cliente/direcciones/editar', {
      titulo: 'Editar dirección',
      errores: errores.array(),
      direccion: { ...direccion.toObject(), ...req.body }
    });
  }

  direccion.nombre = req.body.nombre;
  direccion.descripcion = req.body.descripcion;
  await direccion.save();

  res.redirect('/cliente/direcciones');
};

exports.mostrarEliminarDireccion = async (req, res) => {
  const direccion = await Direccion.findOne({ _id: req.params.id, cliente: req.session.usuario.id });
  if (!direccion) return res.redirect('/cliente/direcciones');

  res.render('cliente/direcciones/eliminar', { titulo: 'Eliminar dirección', direccion });
};

exports.eliminarDireccion = async (req, res) => {
  await Direccion.findOneAndDelete({ _id: req.params.id, cliente: req.session.usuario.id });
  res.redirect('/cliente/direcciones');
};

// ---------- MIS FAVORITOS ----------

exports.misFavoritos = async (req, res) => {
  const cliente = await Usuario.findById(req.session.usuario.id).populate('favoritos').lean();
  res.render('cliente/favoritos', { titulo: 'Mis favoritos', favoritos: cliente.favoritos || [] });
};

exports.removerFavorito = async (req, res) => {
  const cliente = await Usuario.findById(req.session.usuario.id);
  cliente.favoritos = cliente.favoritos.filter(id => id.toString() !== req.params.comercioId);
  await cliente.save();

  res.redirect('/cliente/favoritos');
};