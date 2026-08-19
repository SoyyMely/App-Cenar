const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema({
  itbis: { type: Number, required: true, default: 18 }
}, { timestamps: true });

module.exports = mongoose.model('Configuracion', configuracionSchema);