const Usuario = require('../models/Usuario');
const enviarCorreo = require('../config/mailer');
const { generarToken } = require('../middlewares/tokens');
const { rutaHomePorRol } = require('../middlewares/auth');
const { validationResult } = require('express-validator');
const emailTemplate = require('../template/emailTemplate');

// ---------- LOGIN ----------

exports.mostrarLogin = (req, res) => {
  res.render('auth/login', { titulo: 'Iniciar sesión' });
};

exports.login = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.render('auth/login', { titulo: 'Iniciar sesión', error: 'Usuario o contraseña incorrectos' });
  }

  const { usuarioOCorreo, password } = req.body;

  const usuario = await Usuario.findOne({
    $or: [{ usuario: usuarioOCorreo }, { correo: usuarioOCorreo }]
  });

  if (!usuario) {
    return res.render('auth/login', { titulo: 'Iniciar sesión', error: 'Usuario o contraseña incorrectos' });
  }

  const passwordValida = await usuario.compararPassword(password);
  if (!passwordValida) {
    return res.render('auth/login', { titulo: 'Iniciar sesión', error: 'Usuario o contraseña incorrectos' });
  }

  if (!usuario.activo) {
    return res.render('auth/login', {
      titulo: 'Iniciar sesión',
      error: 'Tu cuenta está inactiva. Revisa tu correo o contacta a un administrador.'
    });
  }

  req.session.usuario = {
    id: usuario._id,
    nombre: usuario.nombre || usuario.nombreComercio,
    rol: usuario.rol
  };

  res.redirect(rutaHomePorRol(usuario.rol));
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

// ---------- REGISTRO CLIENTE / DELIVERY ----------

exports.mostrarRegistroClienteDelivery = (req, res) => {
  res.render('auth/registroClienteDelivery', { titulo: 'Registrarse' });
};

exports.registrarClienteDelivery = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.render('auth/registroClienteDelivery', {
      titulo: 'Registrarse',
      errores: errores.array(),
      datos: req.body
    });
  }

  const { nombre, apellido, telefono, correo, usuario, password, confirmarPassword, rol } = req.body;

  if (password !== confirmarPassword) {
    return res.render('auth/registroClienteDelivery', {
      titulo: 'Registrarse',
      errores: [{ msg: 'Las contraseñas no coinciden' }],
      datos: req.body
    });
  }

  const existente = await Usuario.findOne({ $or: [{ correo }, { usuario }] });
  if (existente) {
    return res.render('auth/registroClienteDelivery', {
      titulo: 'Registrarse',
      errores: [{ msg: 'El usuario o correo ya está registrado' }],
      datos: req.body
    });
  }

  const tokenActivacion = generarToken();

  const nuevoUsuario = new Usuario({
    rol, // 'cliente' o 'delivery'
    nombre,
    apellido,
    telefono,
    correo,
    usuario,
    password,
    foto: req.file ? req.file.path : null,
    activo: false,
    tokenActivacion
  });

  await nuevoUsuario.save();

  await enviarCorreo({
  to: correo,
  subject: 'Activa tu cuenta en Cenar',
  html: emailTemplate({
    titulo: `¡Hola, ${nombre}!`,
    mensaje: 'Gracias por registrarte en Cenar. Para empezar a pedir de tus restaurantes favoritos, activa tu cuenta haciendo clic en el siguiente botón. Este enlace expira en 24 horas.',
    botonTexto: 'Activar mi cuenta',
    botonUrl: `${process.env.BASE_URL}/activar/${tokenActivacion}`
  })
});

  res.render('auth/registroExitoso', { titulo: 'Registro exitoso' });
};

// ---------- REGISTRO COMERCIO ----------

exports.mostrarRegistroComercio = async (req, res) => {
  const TipoComercio = require('../models/TipoComercio');
  const tipos = await TipoComercio.find().lean();
  res.render('auth/registroComercio', { titulo: 'Registrar comercio', tipos });
};

exports.registrarComercio = async (req, res) => {
  const TipoComercio = require('../models/TipoComercio');
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    const tipos = await TipoComercio.find().lean();
    return res.render('auth/registroComercio', {
      titulo: 'Registrar comercio',
      errores: errores.array(),
      datos: req.body,
      tipos
    });
  }

  const {
    nombreComercio, telefono, correo, horaApertura, horaCierre,
    tipoComercio, password, confirmarPassword
  } = req.body;

  if (password !== confirmarPassword) {
    const tipos = await TipoComercio.find().lean();
    return res.render('auth/registroComercio', {
      titulo: 'Registrar comercio',
      errores: [{ msg: 'Las contraseñas no coinciden' }],
      datos: req.body,
      tipos
    });
  }

  const existente = await Usuario.findOne({ correo });
  if (existente) {
    const tipos = await TipoComercio.find().lean();
    return res.render('auth/registroComercio', {
      titulo: 'Registrar comercio',
      errores: [{ msg: 'El correo ya está registrado' }],
      datos: req.body,
      tipos
    });
  }

  const tokenActivacion = generarToken();
  const usuarioGenerado = nombreComercio.toLowerCase().replace(/\s+/g, '_') + Date.now();

  const nuevoComercio = new Usuario({
    rol: 'comercio',
    nombreComercio,
    telefono,
    correo,
    usuario: usuarioGenerado,
    horaApertura,
    horaCierre,
    tipoComercio,
    password,
    foto: req.file ? req.file.path : null,
    activo: false,
    tokenActivacion
  });

  await nuevoComercio.save();

  await enviarCorreo({
  to: correo,
  subject: 'Activa tu comercio en Cenar',
  html: emailTemplate({
    titulo: `¡Hola, ${nombreComercio}!`,
    mensaje: 'Gracias por registrarte en Cenar. Para empezar a vender en Cenar, activa tu comercio haciendo clic en el siguiente botón. Este enlace expira en 24 horas.',
    botonTexto: 'Activar mi comercio',
    botonUrl: `${process.env.BASE_URL}/activar/${tokenActivacion}`
  })
});

  res.render('auth/registroExitoso', { titulo: 'Registro exitoso' });
};

// ---------- ACTIVACIÓN DE CUENTA ----------

exports.activarCuenta = async (req, res) => {
  const { token } = req.params;

  const usuario = await Usuario.findOne({ tokenActivacion: token });
  if (!usuario) {
    return res.render('auth/activacionInvalida', { titulo: 'Enlace inválido' });
  }

  usuario.activo = true;
  usuario.tokenActivacion = null;
  await usuario.save();

  res.render('auth/activacionExitosa', { titulo: 'Cuenta activada' });
};

// ---------- RECUPERAR CONTRASEÑA ----------

exports.mostrarOlvidoPassword = (req, res) => {
  res.render('auth/olvidoPassword', { titulo: 'Recuperar contraseña' });
};

exports.enviarTokenReset = async (req, res) => {
  const { usuarioOCorreo } = req.body;

  const usuario = await Usuario.findOne({
    $or: [{ usuario: usuarioOCorreo }, { correo: usuarioOCorreo }]
  });

  if (!usuario) {
    return res.render('auth/olvidoPassword', {
      titulo: 'Recuperar contraseña',
      error: 'No existe ningún usuario con ese nombre de usuario o correo'
    });
  }

  const tokenReset = generarToken();
  usuario.tokenReset = tokenReset;
  usuario.tokenResetExpira = Date.now() + 1000 * 60 * 60; // 1 hora
  await usuario.save();

 await enviarCorreo({
  to: usuario.correo,   
  subject: 'Restablece tu contraseña',
  html: emailTemplate({
    titulo: `¡Hola, ${usuario.nombre || usuario.nombreComercio}!`,
    mensaje: 'Has solicitado restablecer tu contraseña en Cenar. Haz clic en el siguiente botón para establecer una nueva contraseña. Este enlace expira en 1 hora.',
    botonTexto: 'Restablecer contraseña',
    botonUrl: `${process.env.BASE_URL}/reset-password/${tokenReset}`
  })
});

  res.render('auth/olvidoPasswordExitoso', { titulo: 'Correo enviado' });
};

exports.mostrarResetPassword = async (req, res) => {
  const { token } = req.params;

  const usuario = await Usuario.findOne({
    tokenReset: token,
    tokenResetExpira: { $gt: Date.now() }
  });

  if (!usuario) {
    return res.render('auth/tokenInvalido', { titulo: 'Enlace inválido o expirado' });
  }

  res.render('auth/resetPassword', { titulo: 'Nueva contraseña', token });
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmarPassword } = req.body;

  const usuario = await Usuario.findOne({
    tokenReset: token,
    tokenResetExpira: { $gt: Date.now() }
  });

  if (!usuario) {
    return res.render('auth/tokenInvalido', { titulo: 'Enlace inválido o expirado' });
  }

  if (password !== confirmarPassword) {
    return res.render('auth/resetPassword', {
      titulo: 'Nueva contraseña',
      token,
      error: 'Las contraseñas no coinciden'
    });
  }

  usuario.password = password; // el pre('save') del modelo la hashea sola
  usuario.tokenReset = null;
  usuario.tokenResetExpira = null;
  await usuario.save();

  res.render('auth/resetPasswordExitoso', { titulo: 'Contraseña actualizada' });
};