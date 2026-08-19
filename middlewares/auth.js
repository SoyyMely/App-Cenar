// Verifica que haya una sesión activa
const estaAutenticado = (req, res, next) => {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.redirect('/login');
};

// Verifica que el usuario logueado tenga uno de los roles permitidos
const tieneRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.session.usuario) {
      return res.redirect('/login');
    }
    if (!rolesPermitidos.includes(req.session.usuario.rol)) {
      return res.status(403).send('No tienes permiso para acceder a esta sección');
    }
    next();
  };
};

// Si ya hay sesión activa y el usuario intenta ir a /login, lo manda a su home según rol
const redirigirSiAutenticado = (req, res, next) => {
  if (req.session && req.session.usuario) {
    return res.redirect(rutaHomePorRol(req.session.usuario.rol));
  }
  next();
};

const rutaHomePorRol = (rol) => {
  switch (rol) {
    case 'cliente': return '/cliente';
    case 'delivery': return '/delivery';
    case 'comercio': return '/comercio';
    case 'administrador': return '/admin';
    default: return '/login';
  }
};

module.exports = { estaAutenticado, tieneRol, redirigirSiAutenticado, rutaHomePorRol };