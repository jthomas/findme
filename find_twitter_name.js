const utils = require('./lib/utils.js')
const Users = require('./lib/users.js')
const fetch = require('node-fetch')

const main = async params => {
  params.user_id = 'twitter|815286'
  if (!params.auth0) throw new Error('Missing auth0 configuration from event parameters')
  if (!params.user_id) throw new Error('Missing user token from event parameters')

  const Users = require('./lib/users.js')
  const users = Users(params.auth0)
  const screen_name = users.screen_name_for_user(params.user_id)

    /*
  const url = `https://${params.auth0.domain}/api/v2/users/${params.user_id}`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${params.auth0.token}`,
    }
  })
  const result = await res.json()
  */

  // Need to handle failures like this... for token expiry
  //console.log('res', result)

  return { screen_name }
}

exports.main = utils.handle_errors(main)
