// Authentication integration with Auth0
const lock = new Auth0Lock(
  'PQQ4fJHdMM6FzxG7yoO1JkC65T6d0XO9',
  'find-me-twitter.eu.auth0.com'
);

// ...when user authenticates, use user profile id to retrieve twitter screen name.
// store this in localStorage as login identifier
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

// check whether user has previously logged in
const is_logged_in = () => !(localStorage.getItem('twitter_user_id') === null)

// return twitter identifier from localStorage.
// if this is not available, return promise which resolves when it is.
const get_twitter_user_id = async () => {
  const twitter_user_id = localStorage.getItem('twitter_user_id')
  
  if (twitter_user_id !== null) {
    console.log('twitter user id restored from localStorage:', twitter_user_id)
    return Promise.resolve(twitter_user_id)
  }

  console.log('twitter user id not available, waiting for localStorage update...')

  return new Promise((resolve, reject) => {
    const el = e => {
      if (e.key !== 'twitter_user_id') return
      window.removeEventListener('storage', el)
      console.log('twitter user id now available:', e.newValue)
      resolve(e.newValue)
    }
    window.addEventListener('storage', el)
  })
}

// Page event handlers
// Set up login buttons and check form controls
document.addEventListener('DOMContentLoaded', () => {
  login_btns()
  keyup({})
}, false);

// Log out user, remove cache data and trigger auth0 logout
const logout = () => {
  console.log('logging out...')
  localStorage.removeItem('twitter_user_id')
  login_btns()
  lock.logout();
}

// Log in user, trigger auth0 login
const login = () => {
  console.log('logging in...')
  lock.show();
}

// Disable search controls until input field is not empty, also allow enter to search.
const keyup = e => {
  const can_search = has_search_query()
  const el = document.querySelector('.search .button')

  if (can_search) {
    disable_control(el, false)
    if(e.keyCode === 13){
      twitter_search()
     }
  } else {
    disable_control(el)
  }     
}

// fire twitter search when input query is available.
// poll search results and update page with status information.
const twitter_search = async () => {
  if (!has_search_query()) {
    return
  }

  if (!is_logged_in()) {
    login()
  }

  // this value resolves once user login has finished
  const screen_name = await get_twitter_user_id()
  const query = search_query()
  console.log("search twitter for", query)

  disable_search_controls()
  reset_search_results()

  // fire new search request, responds with job identifier to check status
  const result = await search(query, screen_name)
  console.log("search response", result.job_id)
  
  update_page_results()
  let status = {}
    
  const tweets = new Set()
  // poll for status updates until search is finished
  while(status.status !== 'finished') {        
      status = await search_status(result.job_id)
      console.log(status)
      if (status.status !== 'searching') {            
          hide_elements(".results.waiting")
          hide_elements(".results.available", false)
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

  disable_search_controls(false)    
}

// Page modification functions
// Update search results panel with current results
const update_page_results = (tweets = 0, images = 0, processed = 0, matches = 0) => {
    document.querySelectorAll(".tweets").forEach((el) => el.innerText = tweets)
    document.querySelectorAll(".tweet-images").forEach((el) => el.innerText = images)
    document.querySelectorAll(".processed-images").forEach((el) => el.innerText = processed)
    document.querySelectorAll(".matching-images").forEach((el) => el.innerText = matches)
}

// Add new twitter widget for tweet with id to page container
const add_tweet = id => {
    const el = document.createElement('div')
    el.className = 'content is-inline-flex tweet'
    document.getElementById("tweet_container").appendChild(el)
    twttr.widgets.createTweet(id, el, { theme: 'light' });
}

// Set up results panel for new search results
const reset_search_results = () => {
  document.getElementById('tweet_container').innerHTML = ''
  hide_elements(".results.waiting", false)
  hide_elements(".results.available")
}

// Stop people firing new searches until previous one has finished.
const disable_search_controls = (disable = true) => {
  document.querySelector('#search').disabled = disable
  disable_control(document.querySelector('.search .button'), disable)

  const operation = disable ? 'add' : 'remove'
  document.querySelector('.search .button').classList[operation]('is-loading')  
}

// Toggle visibility of login & logout buttons based on page state.
const login_btns = () => {
  const logged_in = is_logged_in()
  const login_elems = ".control.login"
  const logout_elems = ".control.logout"

  if (logged_in) {
    hide_elements(login_elems)
    hide_elements(logout_elems, false)    
  } else {    
    hide_elements(login_elems, false)
    hide_elements(logout_elems)    
  }
}

// DOM utility functions
const hide_elements = (selector, hide = true) => {
  const operation = hide ? 'add' : 'remove'
  document.querySelectorAll(selector).forEach(el => el.classList[operation]("hidden"))
}

const disable_control = (el, disable = true) => {
  if (disable) {
    el.setAttribute('disabled', true)    
  } else {
    el.removeAttribute('disabled')
  }
}

// Page utilities, check search query field
const search_query = () => document.getElementById("search").value.trim()
const has_search_query = () => search_query().length > 0

// Functions which expose backend API methods.
// Fire new search request, returns job id to monitor status.
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

// Return current status of search request
const search_status = async job_id => {    
  const url = `https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/1310a834667721bb9bf6968e828aa286aa5a287b4e5d46a513aa813a775602fb/findme/api/search/${job_id}`
  const rawResponse = await fetch(url)
  const content = await rawResponse.json();

  return content
}

// Return twitter screen name from user identifier
const twitter_screen_name = async user_id => {    
  const url = `https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/1310a834667721bb9bf6968e828aa286aa5a287b4e5d46a513aa813a775602fb/findme/api/users/screen_name?user_id=${user_id}`
  const rawResponse = await fetch(url)
  const content = await rawResponse.json();

  return content.screen_name
}

const delay = ms => {
  return new Promise(resolve => {
      setTimeout(resolve, ms)
  })
}