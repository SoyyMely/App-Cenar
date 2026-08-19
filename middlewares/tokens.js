const crypto = require('crypto');

const generarToken = () => crypto.randomBytes(32).toString('hex');

module.exports = { generarToken };