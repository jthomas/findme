const webclient = require('./webclient.js')
const apiclient = require('./api.js')
const Twitter = require('twitter')

const AUTH_PARAMS = ['consumer_secret', 'consumer_key', 'access_token_key', 'access_token_secret']

module.exports = (auth) => {
  if (auth.web_client) {
    return webclient
  }
 
  for (let option of AUTH_PARAMS) {
    if (!auth.hasOwnProperty(option)) {
      throw new Error(`Missing authentication parameter for twitter client: ${option}`)
    }
  }

  const client = new Twitter(auth)
  
  return {
    find_images: params => apiclient.find_images(client, params),
    profile_image: webclient.profile_image
  }
}
