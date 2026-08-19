const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
  rol: {
    type: String,
    enum: ['cliente', 'delivery', 'comercio', 'administrador'],
    required: true
  },

  // Campos comunes a cliente, delivery y administrador
  nombre: { type: String, trim: true },
  apellido: { type: String, trim: true },

  // Campo específico de comercio
  nombreComercio: { type: String, trim: true },

  telefono: { type: String, trim: true },
  correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
  usuario: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },

  foto: { type: String, default: null }, // usada como foto de perfil (cliente/delivery/admin) o logo (comercio)

  activo: { type: Boolean, default: false },

  // Tokens para activación de cuenta y reseteo de contraseña
  tokenActivacion: { type: String, default: null },
  tokenReset: { type: String, default: null },
  tokenResetExpira: { type: Date, default: null },

  // --- Campos exclusivos de comercio ---
  horaApertura: { type: String }, // 
  horaCierre: { type: String },   // 
  tipoComercio: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoComercio' },

  // --- Campo exclusivo de delivery ---
  disponible: { type: Boolean, default: true }, // true = disponible, false = ocupado

  favoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],

  // --- Campo exclusivo de administrador ---
  cedula: { type: String, trim: true }

}, { timestamps: true });

// Hashear la contraseña automáticamente antes de guardar
usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas en el login
usuarioSchema.methods.compararPassword = function (passwordIngresada) {
  return bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);