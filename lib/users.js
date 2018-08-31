const ManagementClient = require('auth0').ManagementClient

const tokens_and_name = async (auth0, id) => {
  try {
    const result = await auth0.getUser({id})
    const token = result.identities
      .filter(i => i.connection === 'twitter').pop()

    if (!token) return

    return { 
      tokens: {
        access_token_key: token.access_token,
        access_token_secret: token.access_token_secret,
      },
      name: result.screen_name
    }
  } catch (err) {
    if (err.statusCode === 404) {
      console.log('Unable to find auth0 user with id:', id)
      return
    }
    throw err
  }
}

module.exports = auth => {
  // need to check for missing params
  const auth0 = new ManagementClient(auth)

  return { 
    tokens_and_name: user => tokens_and_name(auth0, user)
  }
}
