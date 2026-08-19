const mongoose = require('mongoose');

const productoPedidoSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  nombre: { type: String, required: true },  // se guarda "congelado" por si el producto cambia después
  precio: { type: Number, required: true }
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  comercio: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  direccion: { type: mongoose.Schema.Types.ObjectId, ref: 'Direccion', required: true },

  productos: { type: [productoPedidoSchema], required: true },

  subtotal: { type: Number, required: true },
  itbis: { type: Number, required: true },   // porcentaje aplicado en el momento del pedido
  total: { type: Number, required: true },

  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'completado'],
    default: 'pendiente'
  }
}, { timestamps: true }); // createdAt sirve como "fecha y hora del pedido"

module.exports = mongoose.model('Pedido', pedidoSchema);