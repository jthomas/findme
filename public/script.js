const twitter_search = async () => {
    const query = document.getElementById("search").value
    document.querySelector('#search').disabled = true
    document.querySelector('.button').setAttribute('disabled', true)
    document.querySelector('.button').classList.add('is-loading')
    console.log("search twitter", query)

    document.querySelectorAll(".results.waiting").forEach((el) => el.setAttribute('style', ''))
    document.querySelectorAll(".results.available").forEach((el) => el.setAttribute('style', 'display: none'))
    const user = 'thomasj'
    const result = await search(query, user)
    console.log(result.job_id)

    
    update_page_results()
    let status = {}

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
            status.matches.forEach(add_tweet)
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
    const result = {
        job_id: "518b49c0-a61f-11e8-98a2-819e5f7c9b23"
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(result), 1000)
    })
    
}

const _results = [
    { status: "searching"},
    { status: "processing", total: 129, images: 84, processed: 0},
    { status: "processing", total: 129, images: 84, processed: 4},
    { status: "processing", total: 129, images: 84, processed: 29, matches: ["1015219373026545664", "1015571475863146497"]},
    { status: "processing", total: 129, images: 84, processed: 68, matches: ["1015219373026545664", "1015571475863146497", "1015279371530227712"]},
    { status: "finished", total: 129, images: 84, processed: 84, matches: ["1015219373026545664", "1015571475863146497", "1015279371530227712", "1015153185072263168"]}
]

const search_status = job_id => {    
    return new Promise((resolve, reject) => {
        const current_result = _results.splice(0, 1)
        setTimeout(() => resolve(current_result[0]), Math.random()* 1000)
    })
}