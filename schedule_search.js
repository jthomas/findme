const utils = require('./lib/utils.js')
const redis = require('./lib/redis.js')
const jobs = require('./lib/jobs.js')
const Users = require('./lib/users.js')
const openwhisk = require('openwhisk');

const main = async params => {
  // re-factor all this out.
  if (!params.redis) throw new Error('Missing redis connection URL from event parameters')
  if (!params.query) throw new Error('Missing query parameter from event parameters')
  if (!params.user) throw new Error('Missing user parameter from event parameters')
  if (!params.auth0) throw new Error('Missing twitter parameter from event parameters')

  console.log('invoked with params', params)

  const users = Users(params.auth0)
  // need user token to use correct keys
  const tokens_and_name = await users.tokens_and_name(params.user)
  console.log('tokens_and_name', tokens_and_name)
  if (!tokens_and_name) throw new Error('Unable to retrieve Twitter API credentials for user from Auth0.')
  console.log('found twitter client tokens for user')

  const client = redis(params.redis)
  const job_id = await jobs.create(client, params.query, tokens_and_name.name)
  console.log('created new job id:', job_id)

  const ow = openwhisk()
  const name = 'search_request'
  const trigger_params = {id: job_id, query: params.query, user: tokens_and_name.name, twitter: tokens_and_name.tokens}
  console.log('trigger_params', trigger_params)
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
