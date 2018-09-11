const redis = require('./lib/redis.js')
const utils = require('./lib/utils.js')
const jobs = require('./lib/jobs.js')

const main = async params => {
  if (!params.redis) throw new Error('Missing redis connection URL from event parameters')
  console.log('invoked with params', params)

  const id = params.__ow_path.split('/').pop()
  const client = redis(params.redis)
  const job = await jobs.retrieve(client, id)
  const result = { status: 'searching' }

  if (job.results !== "-1") {
    result.status = (job.images !== job.processed) ? 'processing' : 'finished'

    result.total = parseInt(job.results, 10)
    result.images = parseInt(job.images, 10)
    result.processed = parseInt(job.processed, 10)
    result.matches = (await jobs.retrieve_matches(client, id)).map(match => match.split(" ")[0])
  }

  return { body: result }
}

exports.main = utils.handle_errors(main)
