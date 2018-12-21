const redis = require('redis')
const URL = require('url').URL;

let client = null

// use for self-signed redis certificate
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

module.exports = url => {
  if (!client) {
    client = redis.createClient(url, { tls: { servername: new URL(url).hostname} })

    client.on("error", function (err) {
      console.log("redis: error", err);
    });
    client.on("connect", function () {
      console.log("redis: connect");
    });
    client.on("reconnecting", function () {
      console.log("redis: reconnecting");
    });
    client.on("end", function () {
      console.log("redis: end");
    });
    client.on("ready", function () {
      console.log("redis: ready");
    });

  }
  return client
}
