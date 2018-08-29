const utils = require('./lib/utils.js')
const redis = require('./lib/redis.js')
const jobs = require('./lib/jobs.js')
const openwhisk = require('openwhisk');

const main = async params => {
  if (!params.redis) throw new Error('Missing redis connection URL from event parameters')
  if (!params.query) throw new Error('Missing query parameter from event parameters')
  if (!params.user) throw new Error('Missing user parameter from event parameters')
  console.log('invoked with params', params)

  const client = redis(params.redis)
  const job_id = await jobs.create(client, params.query, params.user)
  console.log('created new job id:', job_id)

  const ow = openwhisk()
  const name = 'search_request'
  const trigger_params = {id: job_id, query: params.query, user: params.user}
  console.time('firing trigger')
  return ow.triggers.invoke({name, params: trigger_params}).then(result => {
    console.timeEnd('firing trigger')
    return { job_id }
  }).catch(err => {
    console.error('failed to fire trigger', err)
    return { error: 'failed to fire trigger' }
  })
}

exports.main = utils.handle_errors(main)
