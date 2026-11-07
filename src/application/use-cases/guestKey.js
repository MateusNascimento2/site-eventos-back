const { createHash } = require('crypto');

// O convidado é identificado pelo e-mail
function guestKey(guest) {
  return createHash('sha256').update(guest.email).digest('hex');
}

module.exports = { guestKey };
