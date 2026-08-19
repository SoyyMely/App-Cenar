// Script de UNA SOLA VEZ para crear el primer administrador.
// Uso: node crear-admin.js
// Puedes borrar este archivo después de usarlo.

require('dotenv').config({
  path: process.env.NODE_ENV === 'qa' ? '.env.qa' : '.env'
});

const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');

async function crearAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const existente = await Usuario.findOne({ usuario: 'admin' });
  if (existente) {
    console.log('Ya existe un usuario con ese nombre de usuario.');
    process.exit(0);
  }

  await Usuario.create({
    rol: 'administrador',
    nombre: 'Admin',
    apellido: 'Principal',
    cedula: '00000000000',
    correo: 'admin@appcenar.com',
    usuario: 'admin',
    password: 'admin123', // se hashea sola gracias al pre('save') del modelo
    activo: true
  });

  console.log('Administrador creado:');
  console.log('  usuario: admin');
  console.log('  password: admin123');
  process.exit(0);
}

crearAdmin();
