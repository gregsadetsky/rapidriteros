function setup() {}

function draw() {
  // draw a sine line and move it with frameCount
  background(255);
  stroke(0);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let x = 0; x < width; x++) {
    let angle = map(x, 0, width, 0, TWO_PI);
    let y = map(sin(angle + frameCount * 0.1), -1, 1, 0, height);
    vertex(x, y);
  }
  endShape();
}
