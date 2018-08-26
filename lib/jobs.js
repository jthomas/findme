const uuidv1 = require('uuid/v1')

const create = (client, query, user) => {
  return new Promise((resolve, reject) => {
    const job_id = uuidv1()

    client.hmset(job_id, 'query', query, 'user', user, 'results', -1, 'images', 0, 'processed', 0, (err, res) => {
      if (err) return reject(err)

      resolve(job_id)
    })
  })
}

const save_results = (client, job_id, total, images) => {
  return new Promise((resolve, reject) => {

    client.hmset(job_id, 'results', total, 'images', images, (err, res) => {
      if (err) return reject(err)

      resolve()
    })
  })
}

const retrieve = (client, job_id) => {
  return new Promise((resolve, reject) => {
    client.hgetall(job_id, (err, res) => {
      if (err) return reject(err)

      resolve(res)
    })
  })
}

const retrieve_matches = (client, job_id) => {
  const list_key = `${job_id}#matches`

  return new Promise((resolve, reject) => {
    client.lrange(list_key, 0, -1, (err, res) => {
      if (err) return reject(err)

      resolve(res)
    })
  })
}

const add_processed = (client, job_id, processed) => {
  return new Promise((resolve, reject) => {
    const total = processed.length
    const list_key = `${job_id}#matches`
    const elements = processed.filter(el => el.matches).map(el => `${el.id} ${el.url}`)

    let multi = client.multi()
      .hincrby(job_id, 'processed', total)

    if (elements.length) {
      multi = multi.lpush(list_key, elements)
    }

    console.time('add_processed.multi')
    multi.exec((err, replies) => {
        if (err) return reject(err)

        console.timeEnd('add_processed.multi')
        resolve({})
      });
  })
}

exports.create = create
exports.save_results = save_results
exports.retrieve = retrieve
exports.retrieve_matches = retrieve_matches
exports.add_processed = add_processed
