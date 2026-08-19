const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  precio: { type: Number, required: true, min: 0 },
  foto: { type: String, required: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
  comercio: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);