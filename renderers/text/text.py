import logging
import random
import subprocess
from base64 import b64encode
from pathlib import Path
from time import sleep

from flask import Flask, Response, request
from PIL import Image

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)
log.info("Initializing Text")

app = Flask(__name__)

FONT_PATH = Path("./font-undead-pixel-8.ttf")


@app.route("/render", methods=["POST"])
def render():
    text_to_render = request.json["text"]
    log.info("Rendering text: %s", text_to_render)

    def eventStream():
        # command
        # convert -background black -fill white -size 96x38 -font "/Users/g/Desktop/recurse/42.rapidriter/1.mode-tests/1.text-mode/0.fonts-NotJamFontPack/Undead Pixel Light 8/Undead Pixel 8.ttf" caption:'send 3648 chars of 0 and 1 by osc to 10.100.7.28 port 12000' "out-Undead Pixel 8.png";
        subprocess.run(
            [
                "convert",
                "-background",
                "black",
                "-fill",
                "white",
                "-size",
                "96x38",
                "-pointsize",
                "8",
                "-font",
                # absolute path to font
                FONT_PATH.resolve(),
                f"caption:{text_to_render}",
                "/tmp/out.png",
            ]
        )

        image = Image.open("/tmp/out.png")
        # convert to 1 mode
        image = image.convert("1")
        # get png data
        image_bytes = image.tobytes()
        # base64 encode
        image_base64 = b64encode(image_bytes).decode("utf-8")

        yield f"event: screen_update\ndata: {image_base64}\n\n"

        sleep(1)

        yield "event: end\n\n"

    return Response(eventStream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=80, host="0.0.0.0")
