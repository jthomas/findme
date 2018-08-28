const lock = new Auth0Lock(
  'PQQ4fJHdMM6FzxG7yoO1JkC65T6d0XO9',
  'find-me-twitter.eu.auth0.com'
);

lock.on("authenticated", (authResult) => {
  console.log('authenticated', authResult)
  lock.getUserInfo(authResult.accessToken, async (error, profile) => {
    if (error) {
      console.log('error with getUserInfo', error)
      return;
    }
    
    const user_id = profile.sub
    const screen_name = await twitter_screen_name(user_id)
    console.log('found screen name', screen_name)
    localStorage.setItem('twitter_user_id',screen_name);
    login_btns()
    lock.hide()
  });
});

const is_logged_in = () => !(localStorage.getItem('twitter_user_id') === null)

const get_twitter_user_id = async () => {
  const twitter_user_id = localStorage.getItem('twitter_user_id')

  if (twitter_user_id !== null) return Promise.resolve(twitter_user_id)

  return new Promise((resolve, reject) => {
    const el = e => {
      if (e.key !== 'twitter_user_id') return
      window.removeEventListener('storage', el)
      resolve(e.newValue)
    }
    window.addEventListener('storage', el)
  })
}


const login_btns = () => {
  const logged_in = is_logged_in()
  if (logged_in) {
    document.querySelectorAll(".control.login").forEach((el) => el.setAttribute('style', 'display: none'))
    document.querySelectorAll(".control.logout").forEach((el) => el.setAttribute('style', ''))
  } else {
    document.querySelectorAll(".control.logout").forEach((el) => el.setAttribute('style', 'display: none'))
    document.querySelectorAll(".control.login").forEach((el) => el.setAttribute('style', ''))
  }
}

document.addEventListener('DOMContentLoaded', () => {
  login_btns()
}, false);

const logout = () => {
  console.log('logging out...')
  localStorage.removeItem('twitter_user_id')
  login_btns()
  lock.logout();
}

const login = () => {
  console.log('logging in...')
  lock.show();
}

const keypress = e => {
  if(e.keyCode === 13){
    twitter_search()
   }
}

const twitter_search = async () => {
    if (!is_logged_in()) {
      login()
    }

    const screen_name = await get_twitter_user_id()

    const query = document.getElementById("search").value
    document.querySelector('#search').disabled = true
    document.querySelector('.search .button').setAttribute('disabled', true)
    document.querySelector('.search .button').classList.add('is-loading')
    document.getElementById('tweet_container').innerHTML = ''
    console.log("search twitter", query)

    document.querySelectorAll(".results.waiting").forEach((el) => el.setAttribute('style', ''))
    document.querySelectorAll(".results.available").forEach((el) => el.setAttribute('style', 'display: none'))
    const result = await search(query, screen_name)
    console.log(result.job_id)

    
    update_page_results()
    let status = {}
    
    const tweets = new Set()
    while(status.status !== 'finished') {        
        status = await search_status(result.job_id)
        console.log(status)
        if (status.status !== 'searching') {
            document.querySelectorAll(".results.waiting").forEach((el) => el.setAttribute('style', 'display: none'))
            document.querySelectorAll(".results.available").forEach((el) => el.setAttribute('style', ''))
        }
        const matches = (status.matches || []).length
        update_page_results(status.total, status.images, status.processed, matches)

        if (matches) {
          status.matches.filter(m => !tweets.has(m)).forEach(m => {
            add_tweet(m)
            tweets.add(m)
          })
        }
        await delay(500)
    }

    document.querySelector('#search').disabled = false
    document.querySelector('.search .button').removeAttribute('disabled')
    document.querySelector('.search .button').classList.remove('is-loading')
}

const update_page_results = (tweets = 0, images = 0, processed = 0, matches = 0) => {
    document.querySelectorAll(".tweets").forEach((el) => el.innerText = tweets)
    document.querySelectorAll(".tweet-images").forEach((el) => el.innerText = images)
    document.querySelectorAll(".processed-images").forEach((el) => el.innerText = processed)
    document.querySelectorAll(".matching-images").forEach((el) => el.innerText = matches)
}

const add_tweet = id => {
    const el = document.createElement('div')
    el.className = 'content is-inline-flex'
    el.style = 'vertical-align: top; padding-right: 75px'
    document.getElementById("tweet_container").appendChild(el)
    twttr.widgets.createTweet(id, el, { theme: 'light' });
}

const delay = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

const search = async (query, user) => {
  const url = "https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/1310a834667721bb9bf6968e828aa286aa5a287b4e5d46a513aa813a775602fb/findme/api/search"
  const rawResponse = await fetch(url , {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({query, user})
  });
  const content = await rawResponse.json();

  return content
}

const search_status = async job_id => {    
  const url = `https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/1310a834667721bb9bf6968e828aa286aa5a287b4e5d46a513aa813a775602fb/findme/api/search/${job_id}`
  const rawResponse = await fetch(url)
  const content = await rawResponse.json();

  return content
}

const twitter_screen_name = async user_id => {    
  const url = `https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/1310a834667721bb9bf6968e828aa286aa5a287b4e5d46a513aa813a775602fb/findme/api/users/screen_name?user_id=${user_id}`
  const rawResponse = await fetch(url)
  const content = await rawResponse.json();

  return content.screen_name
}
