

require('dotenv').config({
  path: process.env.NODE_ENV === 'qa' ? '.env.qa' : '.env'
});

const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
const TipoComercio = require('./models/TipoComercio');
const Categoria = require('./models/Categoria');
const Producto = require('./models/Producto');
const Direccion = require('./models/Direccion');
const Pedido = require('./models/Pedido');
const Configuracion = require('./models/Configuracion');

// Imágenes de placeholder (no requieren subir archivos)
const img = (texto, bg = 'E4572E', fg = 'ffffff') =>
  `https://placehold.co/300x300/${bg}/${fg}?text=${encodeURIComponent(texto)}`;

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB. Sembrando datos...\n');

  // ---------- Configuración ----------
  await Configuracion.findOneAndUpdate({}, { itbis: 18 }, { upsert: true, new: true });
  console.log('✔ Configuración (ITBIS 18%)');

  // ---------- Tipos de comercio ----------
  const tiposData = [
    { nombre: 'Restaurantes', descripcion: 'Comida preparada para pedir', icono: img('Restaurantes') },
    { nombre: 'Farmacias', descripcion: 'Medicamentos y salud', icono: img('Farmacia', '1DA36B') },
    { nombre: 'Mercados', descripcion: 'Supermercados y colmados', icono: img('Mercado', 'F5A623') },
    { nombre: 'Café & Postres', descripcion: 'Repostería y bebidas', icono: img('Café', 'B33D1C') },
  ];
  const tipos = {};
  for (const t of tiposData) {
    const doc = await TipoComercio.findOneAndUpdate({ nombre: t.nombre }, t, { upsert: true, new: true });
    tipos[t.nombre] = doc;
  }
  console.log(`✔ ${tiposData.length} tipos de comercio`);

  // ---------- Comercios ----------
  const comerciosData = [
    {
      nombreComercio: 'Fronteras Grill',
      correo: 'fronteras@cenar.com',
      usuario: 'fronterasgrill',
      telefono: '809-555-0101',
      horaApertura: '11:00',
      horaCierre: '22:00',
      tipoComercio: tipos['Restaurantes']._id,
      foto: img('Fronteras', '1D2B36'),
      categorias: [
        { nombre: 'Entradas', descripcion: 'Para picar', productos: [
          { nombre: 'Panes rellenos de chorizo', descripcion: 'Ricos panes rellenos', precio: 420 },
          { nombre: 'Alitas BBQ', descripcion: 'Con guarnición a elegir', precio: 480 },
        ]},
        { nombre: 'Parrilladas', descripcion: 'A la barbacoa', productos: [
          { nombre: 'Parrillada Fronteras 1-2', descripcion: '2 piezas de carne, chorizo y costilla', precio: 1550 },
        ]},
      ],
    },
    {
      nombreComercio: 'Osaka Sushi',
      correo: 'osaka@cenar.com',
      usuario: 'osakasushi',
      telefono: '809-555-0102',
      horaApertura: '12:00',
      horaCierre: '23:00',
      tipoComercio: tipos['Restaurantes']._id,
      foto: img('Osaka', '1D2B36'),
      categorias: [
        { nombre: 'Rolls', descripcion: 'Rolls especiales', productos: [
          { nombre: 'California Roll', descripcion: 'Cangrejo, aguacate, pepino', precio: 380 },
          { nombre: 'Roll Volcán', descripcion: 'Camarón tempura, queso gratinado', precio: 520 },
        ]},
      ],
    },
    {
      nombreComercio: 'Farmacia Hidalgo',
      correo: 'hidalgo@cenar.com',
      usuario: 'farmaciahidalgo',
      telefono: '809-555-0103',
      horaApertura: '07:00',
      horaCierre: '21:00',
      tipoComercio: tipos['Farmacias']._id,
      foto: img('Hidalgo', '1DA36B'),
      categorias: [
        { nombre: 'Analgésicos', descripcion: 'Dolor y fiebre', productos: [
          { nombre: 'Acetaminofén 500mg (caja)', descripcion: '20 tabletas', precio: 150 },
          { nombre: 'Ibuprofeno 400mg (caja)', descripcion: '10 tabletas', precio: 180 },
        ]},
        { nombre: 'Cuidado personal', descripcion: 'Higiene y bienestar', productos: [
          { nombre: 'Alcohol en gel 250ml', descripcion: 'Antibacterial', precio: 120 },
        ]},
      ],
    },
    {
      nombreComercio: 'Twist Churros',
      correo: 'twist@cenar.com',
      usuario: 'twistchurros',
      telefono: '809-555-0104',
      horaApertura: '14:00',
      horaCierre: '22:00',
      tipoComercio: tipos['Café & Postres']._id,
      foto: img('Twist', 'B33D1C'),
      categorias: [
        { nombre: 'Churros', descripcion: 'Rellenos y clásicos', productos: [
          { nombre: 'Churros de Nutella (6u)', descripcion: 'Bañados en azúcar', precio: 260 },
          { nombre: 'Café con leche', descripcion: '12oz', precio: 130 },
        ]},
      ],
    },
  ];

  const comercios = [];
  for (const c of comerciosData) {
    let comercio = await Usuario.findOne({ correo: c.correo });
    if (!comercio) {
      comercio = new Usuario({
        rol: 'comercio',
        nombreComercio: c.nombreComercio,
        correo: c.correo,
        usuario: c.usuario,
        telefono: c.telefono,
        horaApertura: c.horaApertura,
        horaCierre: c.horaCierre,
        tipoComercio: c.tipoComercio,
        foto: c.foto,
        password: 'Comercio123!',
        activo: true,
      });
      await comercio.save();
    }
    comercios.push(comercio);

    for (const cat of c.categorias) {
      let categoria = await Categoria.findOne({ nombre: cat.nombre, comercio: comercio._id });
      if (!categoria) {
        categoria = await Categoria.create({
          nombre: cat.nombre,
          descripcion: cat.descripcion,
          comercio: comercio._id,
        });
      }
      for (const p of cat.productos) {
        const existe = await Producto.findOne({ nombre: p.nombre, comercio: comercio._id });
        if (!existe) {
          await Producto.create({
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            foto: img(p.nombre.slice(0, 12)),
            categoria: categoria._id,
            comercio: comercio._id,
          });
        }
      }
    }
  }
  console.log(`✔ ${comerciosData.length} comercios con categorías y productos`);

  // ---------- Clientes ----------
  const clientesData = [
    { nombre: 'María', apellido: 'Pérez', correo: 'maria@cenar.com', usuario: 'mariaperez', telefono: '809-555-0201',
      direccion: { nombre: 'Casa', descripcion: 'C/ Cerro Mar, Apt. 304' } },
    { nombre: 'José', apellido: 'Gutiérrez', correo: 'jose@cenar.com', usuario: 'joseg', telefono: '809-555-0202',
      direccion: { nombre: 'Oficina', descripcion: 'Calle 21 #92' } },
    { nombre: 'Ana', apellido: 'Reyes', correo: 'ana@cenar.com', usuario: 'anareyes', telefono: '809-555-0203',
      direccion: { nombre: 'Casa', descripcion: 'Av. Independencia #45' } },
  ];

  const clientes = [];
  for (const c of clientesData) {
    let cliente = await Usuario.findOne({ correo: c.correo });
    if (!cliente) {
      cliente = new Usuario({
        rol: 'cliente',
        nombre: c.nombre,
        apellido: c.apellido,
        correo: c.correo,
        usuario: c.usuario,
        telefono: c.telefono,
        foto: img(c.nombre, '6B7280'),
        password: 'Cliente123!',
        activo: true,
      });
      await cliente.save();
    }
    clientes.push(cliente);

    const existeDireccion = await Direccion.findOne({ cliente: cliente._id, nombre: c.direccion.nombre });
    if (!existeDireccion) {
      await Direccion.create({
        nombre: c.direccion.nombre,
        descripcion: c.direccion.descripcion,
        cliente: cliente._id,
      });
    }
  }
  console.log(`✔ ${clientesData.length} clientes con dirección`);

  // ---------- Delivery ----------
  const deliveryData = [
    { nombre: 'Carlos', apellido: 'Rodríguez', correo: 'carlos@cenar.com', usuario: 'carlosr', telefono: '809-555-0301' },
    { nombre: 'Luis', apellido: 'Fernández', correo: 'luis@cenar.com', usuario: 'luisf', telefono: '809-555-0302' },
  ];
  for (const d of deliveryData) {
    const existe = await Usuario.findOne({ correo: d.correo });
    if (!existe) {
      const nuevo = new Usuario({
        rol: 'delivery',
        nombre: d.nombre,
        apellido: d.apellido,
        correo: d.correo,
        usuario: d.usuario,
        telefono: d.telefono,
        foto: img(d.nombre, '1DA36B'),
        password: 'Delivery123!',
        activo: true,
        disponible: true,
      });
      await nuevo.save();
    }
  }
  console.log(`✔ ${deliveryData.length} delivery`);

  // ---------- Un par de pedidos de ejemplo ----------
  const direccionMaria = await Direccion.findOne({ cliente: clientes[0]._id });
  const productosFronteras = await Producto.find({ comercio: comercios[0]._id }).limit(2);

  if (direccionMaria && productosFronteras.length && comercios[0]) {
    const yaExiste = await Pedido.findOne({ cliente: clientes[0]._id, comercio: comercios[0]._id });
    if (!yaExiste) {
      const subtotal = productosFronteras.reduce((acc, p) => acc + p.precio, 0);
      const itbis = subtotal * 0.18;
      await Pedido.create({
        cliente: clientes[0]._id,
        comercio: comercios[0]._id,
        direccion: direccionMaria._id,
        productos: productosFronteras.map(p => ({ producto: p._id, nombre: p.nombre, precio: p.precio })),
        subtotal,
        itbis: 18,
        total: subtotal + itbis,
        estado: 'pendiente',
      });
      console.log('✔ 1 pedido de ejemplo (pendiente)');
    }
  }

  console.log('\nListo. Credenciales de prueba (todas activas):');
  console.log('  Comercios: fronterasgrill / osakasushi / farmaciahidalgo / twistchurros  →  Comercio123!');
  console.log('  Clientes:  mariaperez / joseg / anareyes  →  Cliente123!');
  console.log('  Delivery:  carlosr / luisf  →  Delivery123!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error al sembrar datos:', err);
  process.exit(1);
});
