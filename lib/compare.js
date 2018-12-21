const tf = require('@tensorflow/tfjs-core')
const Image = require('./image.js')
const memoryUsage = require('./utils.js').memoryUsage

const imageToInput = (image, numChannels = 3) => {
  const values = Image.byte_array(image, numChannels)
  const outShape = [image.height, image.width, numChannels];
  const input = tf.tensor3d(values, outShape, 'int32');

  return input
}

const find_face = async (models, buf) => {
  console.time(`find_face`)

  const data = Image.parse(buf)
  const input = imageToInput(data)

  const faceDescriptor = await models.detectSingleFace(input)
    .withFaceLandmarks()
    .withFaceDescriptor()

  input.dispose()
  console.timeEnd(`find_face`)

  return faceDescriptor
}

const find_faces = async (models, buf) => {
  console.time(`find_faces`)
  const data = Image.parse(buf)
  const input = imageToInput(data)

  const faceDescriptors = await models.detectAllFaces(input)
    .withFaceLandmarks()
    .withFaceDescriptors()

  input.dispose()
  console.timeEnd(`find_faces`)
  return faceDescriptors
}

const face_match = (models, profile, images) => {
  const labeledDescriptor = new models.LabeledFaceDescriptors('profile', [profile])
  const profileFaceMatcher = new models.FaceMatcher([labeledDescriptor])

  return images
    .map(fd => profileFaceMatcher.findBestMatch(fd.descriptor).label)
    .includes('profile')
}

exports.find_faces = find_faces
exports.find_face = find_face
exports.face_match = face_match
