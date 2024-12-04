const AES = require("crypto-js/aes");
const enc = require('crypto-js/enc-utf8');
const SHA256 = require('crypto-js/sha256')

module.exports = {
  sha256Encrypt,
  aesEncrypt,
  aesDecrypt
}

function sha256Encrypt(data) {
  return SHA256(data).toString();
};

function aesEncrypt(data, key) {
    // const key = process.env.PASSWORD_SECRET ?? ''
    return AES.encrypt(data, key).toString();
};

function aesDecrypt(data, key) {
    if (!data) return "";
    // const key = process.env.PASSWORD_SECRET ?? ''

    const bytes = AES.decrypt(data, key);
    const decryptedData = bytes.toString(enc);

    return decryptedData;
};