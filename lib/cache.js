'use strict';

const serialise = require('./serialise.js')

const get = (client, key) => {
  console.time('cache.get')
  return new Promise((resolve, reject) => {
    client.get(key, (err, res) => {
      if (err) return reject(err)

      console.timeEnd('cache.get')
      resolve(serialise.decode(res))
    })
  })
}

const set = (client, key, value) => {
  console.time('cache.set')
  return new Promise((resolve, reject) => {
    client.set(key, serialise.encode(value), (err, res) => {
      if (err) return reject(err)
      
      console.timeEnd('cache.set')
      resolve(res)
    })
  })
}

exports.get = get
exports.set = set
