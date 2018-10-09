// Application configuration. Replace values with your parameters...
const CONFIG = {
  auth0: {
    clientId: '<CLIENT_ID>',
    domain: '<USER_ID>.auth0.com'
  },
  backend: 'https://<APIGW_URL>/findme'
}

// Authentication integration with Auth0
const lock = new Auth0Lock(CONFIG.auth0.clientId, CONFIG.auth0.domain)

// ...when user authenticates, save profile id in localStorage as login identifier
lock.on("authenticated", (authResult) => {
  console.log('authenticated', authResult)
  lock.getUserInfo(authResult.accessToken, async (error, profile) => {
    if (error) {
      console.log('error with getUserInfo', error)
      show_error('Failed to retrieve user profile from auth0. 🤷‍♀️🤷‍♂️')
      return;
    }
    
    const user_id = profile.sub
    localStorage.setItem('twitter_user_id', user_id);
    console.log('found twitter id', user_id)
    login_btns()
    lock.hide()
  });
});

lock.on("unrecoverable_error", err => {
  console.log('unrecoverable_error', err)
  lock.hide()
  show_error(`Auth0 returned an 'unrecoverable_error' code. This is bad. Time to reboot your computer?!`)
});

lock.on("authorization_error", err => {
  console.log('authorization_error', err)
});

// check whether user has previously logged in
const is_logged_in = () => {
  return localStorage.getItem('twitter_user_id') !== null 
}

// access key in localstorage
// if this is not available, return promise which resolves when it is.
const async_retrieve = async key => {
  const value = localStorage.getItem(key)
  
  if (value !== null) {
    console.log(key, 'restored from localStorage:', value)
    return Promise.resolve(value)
  }

  console.log(key, 'not available, waiting for localStorage update...')

  return new Promise((resolve, reject) => {
    const el = e => {
      if (e.key !== key) return
      window.removeEventListener('storage', el)
      console.log(key, 'now available:', e.newValue)
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

  try {
    // this value resolves once user login has finished
    const id = await async_retrieve('twitter_user_id')
    const query = search_query()
    console.log("search twitter for", query)

    disable_search_controls()
    reset_search_results()

    // fire new search request, responds with job identifier to check status
    const result = await search(query, id)
    console.log("search response", result.job_id)

    update_page_results()
    let status = {}

    const tweets = new Set()
    
    // poll for five minutes at most, don't want to continue for ever.
    const should_poll = poll_check(5 * 60)
    // poll for status updates until search is finished
    while (should_poll(status.status)) {
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
  } catch (err) {
    show_error(err.message)
  }

  disable_search_controls(false)    
}

const poll_check = max_seconds => {
  const start = Date.now()
  const max_milliseconds = max_seconds * 1000

  return status => {
    const elapsed = Date.now() - start
    return elapsed < max_milliseconds && status !== 'finished'
  }
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
const hide_error = () => document.getElementById("modal").classList.remove("is-active")
const show_error = message => {  
  document.querySelector("#modal .message-body").innerText = message
  document.getElementById("modal").classList.add("is-active")
}


// Functions which expose backend API methods.
// Fire new search request, returns job id to monitor status.
const search = async (query, user) => {
  const url = `${CONFIG.backend}/api/search`
  const rawResponse = await fetch(url , {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({query, user})
  });

  if (!rawResponse.ok) {
    throw new Error("Search service returned non-200 HTTP response! Unable to create new search request. Try again?")
  }

  const content = await rawResponse.json();

  return content
}

// Return current status of search request
const search_status = async job_id => {    
  const url = `${CONFIG.backend}/api/search/${job_id}`
  const rawResponse = await fetch(url)

  if (!rawResponse.ok) {
    throw new Error(`Search status service returned non-200 HTTP response! Unable to check status for search request (${job_id}). Try again?`)
  }

  const content = await rawResponse.json();

  return content
}

const delay = ms => {
  return new Promise(resolve => {
      setTimeout(resolve, ms)
  })
}
