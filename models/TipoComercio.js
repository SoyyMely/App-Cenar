const mongoose = require('mongoose');

const tipoComercioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  icono: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('TipoComercio', tipoComercioSchema);