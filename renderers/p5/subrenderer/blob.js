"use strict";

const { Readable } = require('stream');

exports.Blob = class Blob {
  constructor(parts, options) {
    this._buffer = Buffer.concat(parts);

    this.type = options.type;
  }

  get size() {
    return this._buffer.length;
  }

  arrayBuffer() {
    return this._buffer;
  }

  stream() {
    return Readable.from(this._buffer);
  }

  slice(start, end, contentType) {
    const { size } = this;

    let relativeStart, relativeEnd, relativeContentType;

    if (start === undefined) {
      relativeStart = 0;
    } else if (start < 0) {
      relativeStart = Math.max(size + start, 0);
    } else {
      relativeStart = Math.min(start, size);
    }
    if (end === undefined) {
      relativeEnd = size;
    } else if (end < 0) {
      relativeEnd = Math.max(size + end, 0);
    } else {
      relativeEnd = Math.min(end, size);
    }

    if (contentType === undefined) {
      relativeContentType = "";
    } else {
      // sanitization (lower case and invalid char check) is done in the
      // constructor
      relativeContentType = contentType;
    }

    const span = Math.max(relativeEnd - relativeStart, 0);

    const slicedBuffer = this._buffer.slice(
      relativeStart,
      relativeStart + span
    );

    return new Blob([slicedBuffer], { type: relativeContentType });
  }
};