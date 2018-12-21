const memoryUsage = require('./utils.js').memoryUsage

require('@tensorflow/tfjs-node')
const faceapi = require('face-api.js')

let LOADED = false

const load = async location => {
  console.time('models.load')
  
  if (!LOADED) {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(location)
    await faceapi.nets.faceLandmark68Net.loadFromDisk(location)
    await faceapi.nets.faceRecognitionNet.loadFromDisk(location)

    LOADED = true
    //    console.time('gc')
    // global.gc();
    // console.timeEnd('gc')
    // console.log(memoryUsage())
  }

  console.timeEnd('models.load')
  return faceapi
}

exports.load = load
