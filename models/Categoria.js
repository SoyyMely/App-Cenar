const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  comercio: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Categoria', categoriaSchema);