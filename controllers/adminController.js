const TipoComercio = require('../models/TipoComercio');
const Configuracion = require('../models/Configuracion');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const bcrypt = require('bcrypt');


// ---------- TIPOS DE COMERCIO ----------

exports.listarTiposComercio = async (req, res) => {
  const Usuario = require('../models/Usuario');
  const tipos = await TipoComercio.find().lean();

  // agregar la cantidad de comercios por tipo
  for (const tipo of tipos) {
    tipo.cantidadComercios = await Usuario.countDocuments({ rol: 'comercio', tipoComercio: tipo._id });
  }

  res.render('admin/tiposComercio/listado', { titulo: 'Tipos de comercio', tipos });
};

exports.mostrarCrearTipoComercio = (req, res) => {
  res.render('admin/tiposComercio/crear', { titulo: 'Crear tipo de comercio' });
};

exports.crearTipoComercio = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty() || !req.file) {
    return res.render('admin/tiposComercio/crear', {
      titulo: 'Crear tipo de comercio',
      errores: errores.array().length ? errores.array() : [{ msg: 'El icono es obligatorio' }],
      datos: req.body
    });
  }

  const { nombre, descripcion } = req.body;

  await TipoComercio.create({
    nombre,
    descripcion,
    icono: `/uploads/${req.file.filename}`
  });

  res.redirect('/admin/tipos-comercio');
};

exports.mostrarEditarTipoComercio = async (req, res) => {
  const tipo = await TipoComercio.findById(req.params.id).lean();;
  if (!tipo) return res.redirect('/admin/tipos-comercio');

  res.render('admin/tiposComercio/editar', { titulo: 'Editar tipo de comercio', tipo });
};

exports.editarTipoComercio = async (req, res) => {
  const errores = validationResult(req);
  const tipo = await TipoComercio.findById(req.params.id);
  if (!tipo) return res.redirect('/admin/tipos-comercio');

  if (!errores.isEmpty()) {
    return res.render('admin/tiposComercio/editar', {
      titulo: 'Editar tipo de comercio',
      errores: errores.array(),
      tipo: { ...tipo.toObject(), ...req.body }
    });
  }

  const { nombre, descripcion } = req.body;

  tipo.nombre = nombre;
  tipo.descripcion = descripcion;
  if (req.file) {
    tipo.icono = `/uploads/${req.file.filename}`;
  }
  await tipo.save();

  res.redirect('/admin/tipos-comercio');
};

exports.mostrarEliminarTipoComercio = async (req, res) => {
  const tipo = await TipoComercio.findById(req.params.id).lean();;
  if (!tipo) return res.redirect('/admin/tipos-comercio');

  res.render('admin/tiposComercio/eliminar', { titulo: 'Eliminar tipo de comercio', tipo });
};

exports.eliminarTipoComercio = async (req, res) => {
  const Usuario = require('../models/Usuario');
  const Categoria = require('../models/Categoria');
  const Producto = require('../models/Producto');
  const Pedido = require('../models/Pedido');

  const comercios = await Usuario.find({ rol: 'comercio', tipoComercio: req.params.id }).select('_id');
  const comercioIds = comercios.map(c => c._id);

  await Pedido.deleteMany({ comercio: { $in: comercioIds } });
  await Producto.deleteMany({ comercio: { $in: comercioIds } });
  await Categoria.deleteMany({ comercio: { $in: comercioIds } });
  await Usuario.deleteMany({ _id: { $in: comercioIds } });
  await TipoComercio.findByIdAndDelete(req.params.id);

  res.redirect('/admin/tipos-comercio');
};
// ---------- CONFIGURACIÓN ----------

exports.mostrarConfiguracion = async (req, res) => {
  let config = await Configuracion.findOne().lean();;
  if (!config) {
    config = await Configuracion.create({ itbis: 18 });
  }
  res.render('admin/configuracion/ver', { titulo: 'Configuración', config });
};

exports.mostrarEditarConfiguracion = async (req, res) => {
  const config = await Configuracion.findOne().lean();;
  res.render('admin/configuracion/editar', { titulo: 'Editar configuración', config });
};

exports.editarConfiguracion = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const config = await Configuracion.findOne().lean(); 
    return res.render('admin/configuracion/editar', {
      titulo: 'Editar configuración',
      errores: errores.array(),
      config
    });
  }

  const { itbis } = req.body;

  await Configuracion.findOneAndUpdate({}, { itbis }, { upsert: true, new: true });

  res.redirect('/admin/configuracion');
};


// ---------- DASHBOARD ----------

exports.home = async (req, res) => {
  const [
    pedidosTotales,
    pedidosHoy,
    comerciosActivos,
    comerciosInactivos,
    clientesActivos,
    clientesInactivos,
    deliveryActivos,
    deliveryInactivos,
    productosCreados
  ] = await Promise.all([
    Pedido.countDocuments(),
    Pedido.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } }),
    Usuario.countDocuments({ rol: 'comercio', activo: true }),
    Usuario.countDocuments({ rol: 'comercio', activo: false }),
    Usuario.countDocuments({ rol: 'cliente', activo: true }),
    Usuario.countDocuments({ rol: 'cliente', activo: false }),
    Usuario.countDocuments({ rol: 'delivery', activo: true }),
    Usuario.countDocuments({ rol: 'delivery', activo: false }),
    Producto.countDocuments()
  ]);

  res.render('admin/home', {
    titulo: 'Panel de administrador',
    indicadores: {
      pedidosTotales, pedidosHoy,
      comerciosActivos, comerciosInactivos,
      clientesActivos, clientesInactivos,
      deliveryActivos, deliveryInactivos,
      productosCreados
    }
  });
};

// ---------- LISTADO DE CLIENTES ----------

exports.listarClientes = async (req, res) => {
  const clientes = await Usuario.find({ rol: 'cliente' }).lean();

  for (const c of clientes) {
    c.cantidadPedidos = await Pedido.countDocuments({ cliente: c._id });
  }

  res.render('admin/clientes/listado', { titulo: 'Clientes', clientes });
};

exports.cambiarEstadoCliente = async (req, res) => {
  const cliente = await Usuario.findOne({ _id: req.params.id, rol: 'cliente' });
  if (cliente) {
    cliente.activo = !cliente.activo;
    await cliente.save();
  }
  res.redirect('/admin/clientes');
};

// ---------- LISTADO DE DELIVERY ----------

exports.listarDelivery = async (req, res) => {
  const deliveries = await Usuario.find({ rol: 'delivery' }).lean();

  for (const d of deliveries) {
    d.cantidadEntregas = await Pedido.countDocuments({ delivery: d._id, estado: 'completado' });
  }

  res.render('admin/delivery/listado', { titulo: 'Delivery', deliveries });
};

exports.cambiarEstadoDelivery = async (req, res) => {
  const delivery = await Usuario.findOne({ _id: req.params.id, rol: 'delivery' });
  if (delivery) {
    delivery.activo = !delivery.activo;
    await delivery.save();
  }
  res.redirect('/admin/delivery');
};

// ---------- LISTADO DE COMERCIOS ----------

exports.listarComercios = async (req, res) => {
  const comercios = await Usuario.find({ rol: 'comercio' }).lean();

  for (const c of comercios) {
    c.cantidadPedidos = await Pedido.countDocuments({ comercio: c._id });
  }

  res.render('admin/comercios/listado', { titulo: 'Comercios', comercios });
};

exports.cambiarEstadoComercio = async (req, res) => {
  const comercio = await Usuario.findOne({ _id: req.params.id, rol: 'comercio' });
  if (comercio) {
    comercio.activo = !comercio.activo;
    await comercio.save();
  }
  res.redirect('/admin/comercios');
};

// ---------- MANTENIMIENTO DE ADMINISTRADORES ----------

exports.listarAdministradores = async (req, res) => {
  const administradores = await Usuario.find({ rol: 'administrador' }).lean();

  administradores.forEach(a => {
    a.esUsuarioActual = a._id.toString() === req.session.usuario.id;
  });

  res.render('admin/administradores/listado', { titulo: 'Administradores', administradores });
};

exports.mostrarCrearAdministrador = (req, res) => {
  res.render('admin/administradores/crear', { titulo: 'Crear administrador' });
};

exports.crearAdministrador = async (req, res) => {
  const { validationResult } = require('express-validator');
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    return res.render('admin/administradores/crear', {
      titulo: 'Crear administrador',
      errores: errores.array(),
      datos: req.body
    });
  }

  const { nombre, apellido, cedula, correo, usuario, password, confirmarPassword } = req.body;

  if (password !== confirmarPassword) {
    return res.render('admin/administradores/crear', {
      titulo: 'Crear administrador',
      errores: [{ msg: 'Las contraseñas no coinciden' }],
      datos: req.body
    });
  }

  const existente = await Usuario.findOne({ $or: [{ correo }, { usuario }] });
  if (existente) {
    return res.render('admin/administradores/crear', {
      titulo: 'Crear administrador',
      errores: [{ msg: 'El usuario o correo ya está registrado' }],
      datos: req.body
    });
  }

  await Usuario.create({
    rol: 'administrador',
    nombre, apellido, cedula, correo, usuario, password,
    activo: true
  });

  res.redirect('/admin/administradores');
};

exports.mostrarEditarAdministrador = async (req, res) => {
  if (req.params.id === req.session.usuario.id) {
    return res.redirect('/admin/administradores');
  }

  const administrador = await Usuario.findOne({ _id: req.params.id, rol: 'administrador' }).lean();
  if (!administrador) return res.redirect('/admin/administradores');

  res.render('admin/administradores/editar', { titulo: 'Editar administrador', administrador });
};

exports.editarAdministrador = async (req, res) => {
  if (req.params.id === req.session.usuario.id) {
    return res.redirect('/admin/administradores');
  }

  const { validationResult } = require('express-validator');
  const errores = validationResult(req);
  const administrador = await Usuario.findOne({ _id: req.params.id, rol: 'administrador' });
  if (!administrador) return res.redirect('/admin/administradores');

  if (!errores.isEmpty()) {
    return res.render('admin/administradores/editar', {
      titulo: 'Editar administrador',
      errores: errores.array(),
      administrador: { ...administrador.toObject(), ...req.body }
    });
  }

  const { nombre, apellido, cedula, correo, usuario, password, confirmarPassword } = req.body;

  administrador.nombre = nombre;
  administrador.apellido = apellido;
  administrador.cedula = cedula;
  administrador.correo = correo;
  administrador.usuario = usuario;

  if (password) {
    if (password !== confirmarPassword) {
      return res.render('admin/administradores/editar', {
        titulo: 'Editar administrador',
        errores: [{ msg: 'Las contraseñas no coinciden' }],
        administrador: { ...administrador.toObject(), ...req.body }
      });
    }
    administrador.password = password; // se hashea sola en el pre('save')
  }

  await administrador.save();

  res.redirect('/admin/administradores');
};

exports.mostrarActivarInactivarAdmin = async (req, res) => {
  if (req.params.id === req.session.usuario.id) {
    return res.redirect('/admin/administradores');
  }

  const administrador = await Usuario.findOne({ _id: req.params.id, rol: 'administrador' }).lean();
  if (!administrador) return res.redirect('/admin/administradores');

  res.render('admin/administradores/confirmarEstado', { titulo: 'Confirmar acción', administrador });
};

exports.cambiarEstadoAdministrador = async (req, res) => {
  if (req.params.id === req.session.usuario.id) {
    return res.redirect('/admin/administradores');
  }

  const administrador = await Usuario.findOne({ _id: req.params.id, rol: 'administrador' });
  if (administrador) {
    administrador.activo = !administrador.activo;
    await administrador.save();
  }

  res.redirect('/admin/administradores');
};