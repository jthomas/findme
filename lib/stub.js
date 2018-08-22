const fs = require('fs');

// This file stubs out the resources needed to load model 
// weights from the filesystem rather than a HTTP endpoint.

class HTMLImageElement{}
class HTMLVideoElement{}
class HTMLCanvasElement{}

global.HTMLImageElement = HTMLImageElement
global.HTMLVideoElement = HTMLVideoElement
global.HTMLCanvasElement = HTMLCanvasElement

exports.fetch = async (file) => {
  return {
    json: () => JSON.parse(fs.readFileSync(file, 'utf8')),
    arrayBuffer: () => fs.readFileSync(file)
  }
}
