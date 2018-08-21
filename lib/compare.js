const faceapi = require('face-api.js')
const fetch = require('node-fetch')

global.fetch = fetch
/**
global.fetch = async (file) => {
  //  console.log(file)

  const contents = fs.readFileSync(file, 'utf8')

  return { json: () => JSON.parse(contents), arrayBuffer: () => fs.readFileSync(file) }
}*/

const memoryUsage = () => {
  let used = process.memoryUsage();
  const values = []
  for (let key in used) {
    values.push(`${key}=${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }

  return `memory used: ${values.join(', ')}`
}

require('@tensorflow/tfjs-node')

class HTMLImageElement{}
class HTMLVideoElement{}
class HTMLCanvasElement{}

global.HTMLImageElement = HTMLImageElement
global.HTMLVideoElement = HTMLVideoElement
global.HTMLCanvasElement = HTMLCanvasElement

const fs = require('fs');
const tf = require('@tensorflow/tfjs-core')

const Image = require('./image.js')

let LOADED = false

const imageToInput = (image, numChannels = 3) => {
  const values = Image.byte_array(image, numChannels)
  const outShape = [image.height, image.width, numChannels];
  const input = tf.tensor3d(values, outShape, 'int32');

  return input
}

const find_faces = async (buf, minConfidence = 0.8) => {
  await load_models()
  const data = Image.parse(buf)
  const input = imageToInput(data)

  const results = await faceapi.allFaces(input, minConfidence)
  input.dispose()
  return results
}

const load_models = async () => {
  if (LOADED) return

    /*
  console.log('loading detection model')
  await faceapi.loadFaceDetectionModel('weights/')
  console.log('loading recognition model')
  await faceapi.loadFaceRecognitionModel('weights/')
  console.log('loading landmark model')
  await faceapi.loadFaceLandmarkModel('weights/')
  */

  console.log('loading detection model')
  await faceapi.loadFaceDetectionModel('https://github.com/justadudewhohacks/face-api.js/raw/master/weights/')
  console.log(memoryUsage())
  console.log('loading recognition model')
  await faceapi.loadFaceRecognitionModel('https://github.com/justadudewhohacks/face-api.js/raw/master/weights/')
  console.log(memoryUsage())
  console.log('loading landmark model')
  await faceapi.loadFaceLandmarkModel('https://github.com/justadudewhohacks/face-api.js/raw/master/weights/')
  console.log(memoryUsage())
  console.log('loaded models')
  LOADED = true
}

const face_match = (a, b, max_distance = 0.6) => {
  const distance = faceapi.euclideanDistance(a, b)
  if (distance <= max_distance) {
    return true
  } 
  
  return false
}

exports.find_faces = find_faces
exports.face_match = face_match
