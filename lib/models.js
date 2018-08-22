const memoryUsage = require('./utils.js').memoryUsage
const faceapi = require('face-api.js')
const tf = require('@tensorflow/tfjs-core')
require('@tensorflow/tfjs-node')

global.fetch = require('./stub.js').fetch

let LOADED = false

const load = async location => {
  console.time('models.load')
  
  if (!LOADED) {
    await faceapi.loadFaceDetectionModel(location)
    await faceapi.loadFaceRecognitionModel(location)
    await faceapi.loadFaceLandmarkModel(location)

    LOADED = true
    console.time('gc')
    global.gc();
    console.timeEnd('gc')
    console.log(memoryUsage())
  }

  console.timeEnd('models.load')
  return faceapi
}

exports.load = load
