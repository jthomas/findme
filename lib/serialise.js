'use strict';

const encode = typearr => {
  console.time('encoding')
  const encoded = Buffer.from(typearr.buffer).toString('hex')
  console.timeEnd('encoding')
  console.log(`encoded typearr of length ${typearr.length} to ${encoded}`)

  return encoded
}

const decode = encoded => {
  if (!encoded) return encoded

  const decoded = Buffer.from(encoded, 'hex')
  const uints = new Uint8Array(decoded)
  const floats = new Float32Array(uints.buffer)
  console.log(`decoded string ${encoded} to typearr of length ${floats.length} with buffer length ${floats.buffer.length}`)
  return floats
}

exports.encode = encode
exports.decode = decode
