const fetch = require('node-fetch')
const querystring = require('querystring')
const cheerio = require('cheerio')

const search_url = (q, max_position) => {
  const params = {
    q, src: 'typd', max_position, f: 'tweets'
  }
  return `https://twitter.com/i/search/timeline?${querystring.stringify(params)}`
}

const parse_image_urls = html => {
  console.time('parse_image_urls')
  const image_regex = /data-image-url="(.+)"/g
  const urls = []
  let results
  while ((results = image_regex.exec(html)) !== null) {
    urls.push(results[1])
  }

  console.timeEnd('parse_image_urls')
  return urls
}

const parse_tweets = html => {
  console.time('parse_tweets')
  const $ = cheerio.load(html)
  const tweets = $('.tweet')
  const images = []
  console.log(`parsed ${tweets.length} tweets from HTML`)
  tweets.each((i, tweet) => {
    const id = $(tweet).attr('data-tweet-id')
    $(tweet).find('div[data-image-url]').each((k, img) => {
      const url = $(img).attr('data-image-url')
      images.push({id, url})
    })
  })
  console.timeEnd('parse_tweets')
  return { total: tweets.length, images }
}

const find_images = async (query, previous = { more: true, cursor: 0 }) => {
  if (!previous.more) return { total: 0, images: [] }
  const results = await find_images_at(query, previous.cursor)
  const next = await find_images(query, results)
  return reduce_results(results, next) 
}

const reduce_results = (results, next) => {
  return [results.tweets, next].reduce((accum, el) => {
    accum.total += el.total
    accum.images = accum.images.concat(el.images)
    return accum
  }, {total: 0, images: []})
}

const find_images_at = async (query, cursor) => {
  const url = search_url(query, cursor)
  console.log('retrieving', url)
  const res = await fetch(url);
  const json = await res.json();
  const tweets = parse_tweets(json.items_html)
  return { tweets, cursor: json.min_position, more: json.has_more_items }
}

const profile_image = async username => {
  console.time('profile_image')
  const url = `https://twitter.com/${username}`
  const res = await fetch(url)
  const html = await res.text()
  const $ = cheerio.load(html)

  const profile_url = $("img.ProfileAvatar-image").attr('src')
  console.log(`twitter user (${username}) has profile url: ${profile_url}`)

  console.timeEnd('profile_image')
  return profile_url
}

exports.find_images = find_images
exports.profile_image = profile_image
