const Window = require("window");
const fs = require("fs");
const { Blob } = require("./blob.js");

// get path to program file as argument
const programFilePath = process.argv[2];
const PROGRAM = fs.readFileSync(programFilePath, "utf8");

// THANKS SO MUCH TO
// https://stackoverflow.com/a/67434089 !!!!!!!!!!!!!!

// globals expected to exist by p5js (must come before the import)
global.window = new Window();
// Override JSDOM's horrible Blob implementations
global.window.Blob = Blob;
global.document = global.window.document;
global.screen = global.window.screen;
global.navigator = global.window.navigator;
global.HTMLCanvasElement = global.window.HTMLCanvasElement;
// override DOMPoint
global.DOMPoint = global.window.DOMPoint;
global.Event = global.window.Event;
global.Image = global.window.Image;

const startTime = Date.now();
const RUN_PROGRAM_FOR_SECONDS = 300;

// this determines how long our program runs!!!
global.window.requestAnimationFrame = (callback) => {
  setTimeout(callback, 1000 / 60);
  if (Date.now() - startTime > RUN_PROGRAM_FOR_SECONDS * 1000) {
    done();
  }
};

const p5 = require("p5");

const {
  setup: userSetup,
  draw: userDraw,
  preload: userPreload,
} = eval(`(function() {
    // nop
    var console = {log: function() {}};
    var createCanvas = function() {};

    ${PROGRAM}

    return {
      setup: (typeof setup === 'function') ? setup : function() {},
      draw: (typeof draw === 'function') ? draw : function() {},
      preload: (typeof preload === 'function') ? preload : function() {}
    };
  })()
`);

let canvas = null;

function copyPPropsToGlobal(p) {
  // add every property found on p onto global
  for (let prop in p) {
    if (typeof p[prop] === "function") {
      // SUPER important to rebind any function to the original p
      global[prop] = p[prop].bind(p);
    } else {
      global[prop] = p[prop];
    }
  }
}

const inst = new p5((p) => {
  p.preload = function () {
    // must copy props to global so that `loadImage` is available
    copyPPropsToGlobal(p);

    userPreload();
  };

  p.setup = function () {
    canvas = p.createCanvas(96, 38);

    // after creating the canvas, `p` will set `width`, `height` and...
    // other globals..? so copy them once again to the globals.
    copyPPropsToGlobal(p);

    userSetup();
  };
  p.draw = function () {
    // update frameCount
    global.frameCount = p.frameCount;

    userDraw();

    canvas.elt.toBlob((data) => {
      // send it back to the parent process
      const canvasData = data.arrayBuffer();
      // base64 encode it
      const canvasDataBase64 = Buffer.from(canvasData).toString("base64");
      // print it + newline
      console.log(canvasDataBase64);
    }, "image/png");
  };
});

function done() {
  inst.remove();
  process.exit(0);
}
