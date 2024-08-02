const fs = require("fs");
var zeros = require("zeros");
var savePixels = require("save-pixels");
var ShaderOutput = require(".");

const programFilePath = process.argv[2];
const PROGRAM = fs.readFileSync(programFilePath, "utf8");

// parse the glsl!!!!!!!!!!!!!!!!!!!!
var draw = ShaderOutput(PROGRAM, {
  width: 96,
  height: 38,
});

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function main() {
  for (let time = 0; time < 10; time += 0.05) {
    //returns the frag color as [R, G, B, A]
    var color = draw({
      u_mouse: [0.5, 0.5],
      u_resolution: [96, 38],
      u_time: time,
    });

    //Create an image
    var x = zeros([96, 38, 3]);

    // iterate through 'color' which is an array of [r, g, b, IGNORE, r, g, b, IGNORE, etc.]
    for (var i = 0; i < color.length; i += 4) {
      var j = i / 4;
      x.set(j % 96, Math.floor(j / 96), 0, 255 * color[i]);
      x.set(j % 96, Math.floor(j / 96), 1, 255 * color[i + 1]);
      x.set(j % 96, Math.floor(j / 96), 2, 255 * color[i + 2]);
    }

    // base64 pipe convert, then console log
    const imageData = await streamToString(savePixels(x, "png"));
    console.log(Buffer.from(imageData).toString("base64"));
  }
}

main();
