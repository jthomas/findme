'use strict';

const utils = require('./lib/utils.js')
const redis = require('./lib/redis.js')
const twitter = require('./lib/twitter/webclient.js')
const jobs = require('./lib/jobs.js')
const cache = require('./lib/cache.js')
const fetch = require('./lib/utils.js').fetch_buffer
const compare = require('./lib/compare.js')
const models = require('./lib/models.js')

const main = async params => {
  if (!params.job) throw new Error('Missing job parameter from event parameters')
  if (!params.tweets) throw new Error('Missing tweets parameter from event parameters')
  if (!params.redis) throw new Error('Missing redis connection URL from event parameters')

  const client = redis(params.redis)
  console.log(`retrieving job details: ${params.job}`)
  const job = await jobs.retrieve(client, params.job) 
  console.log(`found job details:`, JSON.stringify(job))

  const weights_directory = params.weights_directory || '/nodejsAction/weights'
  const model = await models.load(weights_directory)
  let profile_face_descriptor = await cache.get(client, job.user)

  if (!profile_face_descriptor) {
    const url = await twitter.profile_image(job.user) 
    const profile_image = await fetch(url)

    console.log('looking for faces in profile image.')
    const profile_face = await compare.find_face(model, profile_image)

    if (!profile_face) {
      throw new Error(`Unable to find face in twitter profile ${job.user} for comparison.`)
    }

    profile_face_descriptor = profile_face.descriptor
    await cache.set(client, job.user, profile_face_descriptor)
  }

  const match_tweet = async tweet => {
    const url = tweet.url
    console.log('retrieving new image @', url)
    try {
      const image = await fetch(url)

      console.log('finding faces in image @', url)
      const img_faces = await compare.find_faces(model, image)

      console.log(`found ${img_faces.length} faces in ${url}`)

      const matches = compare.face_match(model, profile_face_descriptor, img_faces)
      console.log(`matching faces found @ ${url}: ${matches}`)
      return { url, matches, id: tweet.id }
    } catch (error) {
      console.error('error caught', error);
      return { url, matches: false }
    }
  }

  const matches = await Promise.all(params.tweets.map(match_tweet))
  await jobs.add_processed(client, params.job, matches) 

  return { results: `processed ${matches.length} tweets, found ${matches.filter(i => i.matches).length} faces that match profile image.`}
}

exports.main = utils.handle_errors(main)
