'use strict';

const encode = typearr => {
  console.time('encoding')
  const encoded = Buffer.from(typearr.buffer).toString('hex')
  console.timeEnd('encoding')
  return encoded
}

const decode = encoded => {
  if (!encoded) return encoded

  console.time('decoding')
  const decoded = Buffer.from(encoded, 'hex')
  const uints = new Uint8Array(decoded)
  const floats = new Float32Array(uints.buffer)
  console.timeEnd('decoding')
  return floats
}

exports.encode = encode
exports.decode = decode
