const mongoose = require('mongoose');

const direccionSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },      // ej: "Casa", "Oficina"
  descripcion: { type: String, required: true, trim: true }, // la dirección en sí
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Direccion', direccionSchema);