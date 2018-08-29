const fetch = require('node-fetch')

const memoryUsage = () => {
  let used = process.memoryUsage();
  const values = []
  for (let key in used) {
    values.push(`${key}=${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }

  return `memory used: ${values.join(', ')}`
}

const fetch_buffer = async url => {
  console.time(`fetch_buffer ${url}`)

  const res = await fetch(url)
  const buf = await res.buffer()

  console.timeEnd(`fetch_buffer ${url}`)
  return buf
}

const handle_errors = fn => {
  return (async params => {
    try {
      return await fn(params)
    } catch (err) {
      console.error(err)
      return { error: err.message }
    }
  })
}

exports.memoryUsage = memoryUsage
exports.fetch_buffer = fetch_buffer
exports.handle_errors = handle_errors
