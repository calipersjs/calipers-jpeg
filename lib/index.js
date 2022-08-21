'use strict';

const fs      = require('fs');
const util = require('util');
const pfstat  = util.promisify(fs.fstat);
const pread   = util.promisify(fs.read);

const BUFFER_SIZE = 9;
const SIZE_POS    = 2;
const HEIGHT_POS  = 5;
const WIDTH_POS   = 7;
const SOFs = [
  0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
  0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF
];

exports.detect = function (buffer) {
  return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
};

async function findSOF (fd, buffer, size, offset) {

  if (offset >= size || (buffer && buffer[0] !== 0xFF)) {
    return Promise.reject(new Error('Invalid JPEG file'));
  }

  if (!buffer || SOFs.indexOf(buffer[1]) === -1) {
    const newOffset = buffer ?
      offset + buffer.readUInt16BE(SIZE_POS) + SIZE_POS :
      SIZE_POS;
    buffer = buffer ? buffer : Buffer.alloc(BUFFER_SIZE);
    return pread(fd, buffer, 0, BUFFER_SIZE, newOffset)
      .then((newReadObject) => {
        return findSOF(fd, newReadObject.buffer, size, newOffset);
      });
  }

  return Promise.resolve(buffer);
}

exports.measure = async function (path, fd) {
  const stat = await pfstat(fd);
  const frameBuffer = await findSOF(fd, null, stat.size, 0);
  return {
    type: 'jpeg',
    pages: [{
      height: frameBuffer.readUInt16BE(HEIGHT_POS),
      width: frameBuffer.readUInt16BE(WIDTH_POS)
    }]
  };
};
