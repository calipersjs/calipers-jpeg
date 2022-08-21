'use strict';

const fs     = require('fs');
const path   = require('path');
const expect = require('chai').expect;
const jpeg   = require('../lib/index');

describe('jpeg', () => {

  describe('detect', () => {

    it('should return true for a JPEG', () => {
      const jpegPath = path.resolve(__dirname, 'fixtures/jpeg/123x456.jpg');
      const result = jpeg.detect(fs.readFileSync(jpegPath));
      expect(result).to.eql(true);
    });

    it('should return false for a non-JPEG', () => {
      const pngPath = path.resolve(__dirname, 'fixtures/png/123x456.png');
      const result = jpeg.detect(fs.readFileSync(pngPath));
      expect(result).to.eql(false);
    });

  });

  describe('measure', () => {

    const fixtures = path.resolve(__dirname, 'fixtures/jpeg');
    const files = fs.readdirSync(fixtures);

    files.forEach((file) => {

      const fileSplit = file.split(/x|\./);
      const width = parseInt(fileSplit[0]);
      const height = parseInt(fileSplit[1]);
      const expectedOutput = {
        type: 'jpeg',
        pages: [{ width, height }]
      };

      it(`should return the correct dimensions for ${  file}`, () => {
        const jpegPath = path.resolve(fixtures, file);
        const fd = fs.openSync(jpegPath, 'r');
        return jpeg.measure(jpegPath, fd)
          .then((result) => {
            expect(result).to.eql(expectedOutput);
          })
          .finally(() => {
            fs.closeSync(fd);
          });
      });

    });

    it('should error with a corrupt JPEG', () => {
      const jpegPath = path.resolve(__dirname, 'fixtures/corrupt/corrupt.jpg');
      const fd = fs.openSync(jpegPath, 'r');
      return expect(jpeg.measure(jpegPath, fd)).to.be.rejectedWith(Error);
    });

  });

});
