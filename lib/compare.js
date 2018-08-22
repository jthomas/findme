const tf = require('@tensorflow/tfjs-core')
const Image = require('./image.js')
const memoryUsage = require('./utils.js').memoryUsage

const imageToInput = (image, numChannels = 3) => {
  const values = Image.byte_array(image, numChannels)
  const outShape = [image.height, image.width, numChannels];
  const input = tf.tensor3d(values, outShape, 'int32');

  return input
}

const find_faces = async (models, buf, minConfidence = 0.8) => {
  console.time(`find_faces`)
  const data = Image.parse(buf)
  const input = imageToInput(data)

  const results = await models.allFaces(input, minConfidence)
  input.dispose()
  console.timeEnd(`find_faces`)
  return results
}

const face_match = (models, a, b, max_distance = 0.6) => {
  const distance = models.euclideanDistance(a, b)
  if (distance <= max_distance) {
    return true
  } 
  
  return false
}

exports.find_faces = find_faces
exports.face_match = face_match
