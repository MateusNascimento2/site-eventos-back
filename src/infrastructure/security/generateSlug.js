const { randomBytes } = require('crypto');

// 9 bytes aleatórios viram 12 caracteres seguros para URL
function generateSlug() {
  return randomBytes(9).toString('base64url');
}

module.exports = { generateSlug };
