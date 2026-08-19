const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB conectado (ambiente: ${process.env.NODE_ENV})`);
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = conectarDB;