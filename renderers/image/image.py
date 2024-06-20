import logging
import random
from base64 import b64encode
from pathlib import Path
from time import sleep

from flask import Flask, Response, request
from PIL import Image

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)
log.info("Initializing Image")

IMAGE_PATH = Path("./recurse.png")
log.info("IMAGE_PATH %s", IMAGE_PATH)

app = Flask(__name__)


@app.route("/render", methods=["POST"])
def render():
    log.info("image /render endpoint")

    def eventStream():
        while True:
            image = Image.open(IMAGE_PATH)
            # convert to mode 1!!!!!
            image = image.convert("1")
            # check that mode is 1
            log.info("image.mode %s", image.mode)
            assert image.mode == "1"
            # check that size is 96x38
            log.info("image.size %s", image.size)
            assert image.size == (96, 38)
            # get png data
            image_bytes = image.tobytes()
            # base64 encode
            image_base64 = b64encode(image_bytes).decode("utf-8")
            log.info("image_base64 %s", image_base64[:10] + "...")

            yield f"event: screen_update\ndata: {image_base64}\n\n"

            sleep(1)

            yield "event: end\n\n"

    return Response(eventStream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=80, host="0.0.0.0")
