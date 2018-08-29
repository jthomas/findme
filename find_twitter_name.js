const utils = require('./lib/utils.js')
const fetch = require('node-fetch')

const main = async params => {
  if (!params.auth0) throw new Error('Missing auth0 configuration from event parameters')
  if (!params.user_id) throw new Error('Missing user token from event parameters')

  const url = `https://${params.auth0.domain}/api/v2/users/${params.user_id}`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${params.auth0.token}`,
    }
  })
  const result = await res.json()

  // Need to handle failures like this... for token expiry
  console.log('res', result)

  return { screen_name: result.screen_name }
}

exports.main = utils.handle_errors(main)
