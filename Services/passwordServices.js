const crypto = require('crypto');

function hashPassword(password) {
    const password_salt = crypto.randomBytes(16).toString('hex');
    const password_hash = crypto
        .pbkdf2Sync(password, password_salt, 10000, 64, 'sha512')
        .toString('hex');
    return { password_hash, password_salt };
}

module.exports = { hashPassword };