// https://github.com/Russ741/droste-p5/blob/main/sketch.js

class Shape {
  relX;
  relY;
  relR;
  color;

  constructor(relX, relY, relR, color) {
    this.relX = relX;
    this.relY = relY;
    this.relR = relR;
    this.color = color;
  }
}

class Recursion {
  relX;
  relY;
  relR;

  constructor(shape) {
    this.relX = shape.relX;
    this.relY = shape.relY;
    this.relR = shape.relR;
  }
}

const hs2 = 0.5 / Math.sqrt(2);

// TODO: Specify shapes and recursions separately.
const shapes = [
  new Shape(0, 0, 1, "black"),
  new Shape(-hs2, hs2, 0.5, "white"),
  new Shape(hs2, -hs2, 0.5, "white"),
  new Shape(hs2, -hs2, 0.25, "black"),
  new Shape(-hs2, hs2, 0.25, "black"),
];

const recursions = [new Recursion(shapes[3]), new Recursion(shapes[4])];

const recurseMillis = 2000;

function setup() {
  width = 96;
  height = 38;
  loopRatio = 1;
  loopRatio = recursions.reduce((acc, cur) => acc * cur.relR, loopRatio);
  loopMillis = recursions.length * recurseMillis;
  // createCanvas(width, height);
  startMillis = millis();
  noStroke();
}

function drawRecursive(r, x, y) {
  if (r < 0.25) {
    // Too small to be worth drawing; stop
    return;
  }
  for (const shape of shapes) {
    fill(shape.color);
    circle(shape.relX * r + x, shape.relY * r + y, 2 * shape.relR * r);
  }

  for (const recursion of recursions) {
    drawRecursive(
      r * recursion.relR,
      r * recursion.relX + x,
      r * recursion.relY + y,
    );
  }
}

function draw() {
  background(255);
  translate(width / 2, height / 2);
  const elapsedMillis = millis() - startMillis;

  const loopProgress = (elapsedMillis % loopMillis) / loopMillis;
  const step = floor(loopProgress * recursions.length);

  const recursion = recursions[step];
  const stepProgress = (loopProgress * recursions.length) % 1;
  const sinProgress = sin((stepProgress * PI) / 2);

  const zoom = (1 / recursion.relR) ** stepProgress;
  // console.log(loopRatio, loopProgress, zoom);
  const r = (height / 2) * zoom;

  const endX = -recursion.relX * r;
  const curX = endX * sinProgress;
  const endY = -recursion.relY * r;
  const curY = endY * sinProgress;
  drawRecursive(r, curX, curY);
}

// Don't need to call new js(); here - https://github.com/processing/p5.js/issues/4985
