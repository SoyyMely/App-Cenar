const path = require('path');
const express = require('express');
const session = require('express-session');
const { engine } = require('express-handlebars');

// Cargar variables de entorno según el ambiente
require('dotenv').config({
  path: process.env.NODE_ENV === 'qa' ? '.env.qa' : '.env'
});

const conectarDB = require('./config/db');

const app = express();

// Conexión a la base de datos
conectarDB();

require('./models/Usuario');
require('./models/TipoComercio');
require('./models/Categoria');
require('./models/Producto');
require('./models/Direccion');
require('./models/Pedido');
require('./models/Configuracion');

// Configuración del motor de plantillas Handlebars
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views/layout'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: (a, b) => a === b
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4 horas
}));

app.get('/', (req, res) => res.redirect('/login'));

app.use('/', require('./routes/authRoutes'));
app.use('/cliente', require('./routes/clienteRoutes'));
app.use('/comercio', require('./routes/comercioRoutes'));
app.use('/delivery', require('./routes/deliveryRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});