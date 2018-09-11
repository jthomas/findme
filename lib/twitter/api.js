"use strict";

const search_twitter = (client, params) => {
  console.time('search_twitter')
  console.log('searching twitter api', params)
  return new Promise((resolve, reject) => {
    client.get('/search/tweets.json', params, (err, tweets) => {
      console.timeEnd('search_twitter')
      if (err) return reject(err)
      resolve(tweets)
    });
  })
}

const parse_images = tweets => {
  return tweets.statuses
    .filter(t => t.entities.media != null)
    .map(t => ({ id: t.id_str, url: t.entities.media[0].media_url }))
}

const should_keep_searching = (current_results, new_results) => {
  // if no more results are available
  // or we have received 1000 results then stop searching
  if (new_results === 0 || current_results >= 1000) return false

  return true
}

const calculate_max_id = tweets => {
  return tweets.map(t => t.id_str).sort().slice(0, 1).map(decrementHugeNumberBy1).pop()
}

const find_images = async (client, query) => {
  console.time('find_images')
  const params = {q: query, count: 100};
  const results = { total: 0, images: [] }

  let should_search = true

  while(should_search) {
    const search_results = await search_twitter(client, params)
    console.log(search_results.statuses[search_results.statuses.length - 1])
    const images = parse_images(search_results)
    const total_results = search_results.statuses.length
    console.log(`found ${images.length} images from ${total_results} tweets.`)

    results.images = results.images.concat(images)
    results.total += total_results
    params.max_id = calculate_max_id(search_results.statuses)

    should_search = should_keep_searching(results.total, total_results)
  }
  
  console.timeEnd('find_images')
  return results
}

// source: https://webapplog.com/decreasing-64-bit-tweet-id-in-javascript/
// twitter ids are bigger than Number.MAX_VALUE
function decrementHugeNumberBy1(n) {
    var allButLast = n.substr(0, n.length - 1);
    var lastNumber = n.substr(n.length - 1);

    if (lastNumber === "0") {
        return decrementHugeNumberBy1(allButLast) + "9";
    }
    else {      
        var finalResult = allButLast + (parseInt(lastNumber, 10) - 1).toString();
        return trimLeft(finalResult, "0");
    }
}

function trimLeft(s, c) {
    var i = 0;
    while (i < s.length && s[i] === c) {
        i++;
    }

    return s.substring(i);
}

exports.find_images = find_images
