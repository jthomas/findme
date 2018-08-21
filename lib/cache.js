'use strict';

const serialise = require('./serialise.js')

const get = (client, key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, res) => {
      if (err) return reject(err)

      resolve(serialise.decode(res))
    })
  })
}

const set = (client, key, value) => {
  return new Promise((resolve, reject) => {
    client.set(key, serialise.encode(value), (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}

exports.get = get
exports.set = set
