'use strict';

const jpeg = require('jpeg-js')
const PNG = require('pngjs').PNG;
const fileType = require('file-type');

const parse = data => {
  const ft = fileType(data)

  if (ft.ext === 'png') return PNG.sync.read(data)
  if (ft.ext === 'jpg') return jpeg.decode(data, true)

  throw new Error('Unable to decode image, unsupported filetype:', ft)
}

const byte_array = (image, numChannels) => {
  const pixels = image.data
  const numPixels = image.width * image.height;
  const values = new Int32Array(numPixels * numChannels);

  for (let i = 0; i < numPixels; i++) {
    for (let channel = 0; channel < numChannels; ++channel) {
      values[i * numChannels + channel] = pixels[i * 4 + channel];
    }
  }

  return values
}

exports.parse = parse
exports.byte_array = byte_array
