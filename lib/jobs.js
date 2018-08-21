const uuidv1 = require('uuid/v1')

const create = (client, query, user) => {
  return new Promise((resolve, reject) => {
    const job_id = uuidv1()

    const job = {
      query, user, results: 0, images: 0, processed: 0
    }

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

const add_processed = (client, job_id, processed) => {
  console.log(job_id, processed)
  return new Promise((resolve, reject) => {
    const total = processed.length
    const list_key = `${job_id}#matches`
    const elements = processed.filter(el => el.matches).map(el => `${el.id} ${el.url}`)

    console.log(total, list_key, elements)
    let multi = client.multi()
      .hincrby(job_id, 'processed', total)

    if (elements.length) {
      multi = multi.lpush(list_key, elements)
    }

    console.log('updating processed results')
    console.time('multi')
    multi.exec((err, replies) => {
        if (err) return reject(err)

        console.log("MULTI got " + replies.length + " replies");
        console.timeEnd('multi')
        resolve({})
      });
  })
}

exports.create = create
exports.save_results = save_results
exports.retrieve = retrieve
exports.add_processed = add_processed
