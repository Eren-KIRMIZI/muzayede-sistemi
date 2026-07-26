const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const certsDir = path.resolve(__dirname, 'certs')

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true })
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

fs.writeFileSync(path.join(certsDir, 'jwt-private.pem'), privateKey)
fs.writeFileSync(path.join(certsDir, 'jwt-public.pem'), publicKey)

console.log('RSA key pair generated in certs/')
