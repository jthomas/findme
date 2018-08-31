const utils = require('./lib/utils.js')
const jobs = require('./lib/jobs.js')
const redis = require('./lib/redis.js')
const TwitterClientFactory= require('./lib/twitter/factory.js')
const openwhisk = require('openwhisk');

const main = async params => {
  console.log('invoked with params', params)
  if (!params.query) throw new Error('Missing query parameter from event parameters')
  if (!params.user) throw new Error('Missing user parameter from event parameters')
  if (!params.id) throw new Error('Missing job id parameter from event parameters')
  if (!params.redis) throw new Error('Missing redis connection URL from event parameters')
  if (!params.twitter) throw new Error('Missing twitter parameters from event parameters')

  const client = redis(params.redis)
  const config = Object.assign({}, params.twitter, params.twitter_client)
  const twitter = TwitterClientFactory(config)

  console.log(`finding images for search query (${params.query}) for user: ${params.user}`) 
  const results = await twitter.find_images(params.query)
  console.log(`twitter search returned ${results.images.length} images from ${results.total} tweets`)

  console.time('save_results')
  await jobs.save_results(client, params.id, results.total, results.images.length)
  console.timeEnd('save_results')
  const name = 'tweet_image'
  const ow = openwhisk()

  console.time('send triggers')
  const triggers = results.images.map(image => {
    const trigger_params = { job: params.id, tweets: [image] }
    return ow.triggers.invoke({name, params: trigger_params})
  })

  await Promise.all(triggers)
  console.timeEnd('send triggers')
  return { tweets: results.total, images: results.images.length }

}

exports.main = utils.handle_errors(main)
