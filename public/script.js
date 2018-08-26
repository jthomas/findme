const keypress = e => {
  if(e.keyCode === 13){
    twitter_search()
   }
}

const twitter_search = async () => {
    const query = document.getElementById("search").value
    document.querySelector('#search').disabled = true
    document.querySelector('.button').setAttribute('disabled', true)
    document.querySelector('.button').classList.add('is-loading')
    document.getElementById('tweet_container').innerHTML = ''
    console.log("search twitter", query)

    document.querySelectorAll(".results.waiting").forEach((el) => el.setAttribute('style', ''))
    document.querySelectorAll(".results.available").forEach((el) => el.setAttribute('style', 'display: none'))
    const user = 'thomasj'
    const result = await search(query, user)
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
    document.querySelector('.button').removeAttribute('disabled')
    document.querySelector('.button').classList.remove('is-loading')
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
