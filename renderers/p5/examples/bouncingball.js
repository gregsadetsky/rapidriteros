let x = 10;
let y = 10;
let xspeed = 5;
let yspeed = 2;

let r = 5;

function setup() {
}

function draw() {
  console.log('DRAW x', x)
  console.log('DRAW y', y)
  console.log('width', width);
  console.log('height', height);

  background(255);
  fill(0);
  ellipse(x, y, r * 2, r * 2);
  x += xspeed;
  y += yspeed;
  if (x > width - r || x < r) {
    xspeed = -xspeed;
  }
  if (y > height - r || y < r) {
    yspeed = -yspeed;
  }
}
