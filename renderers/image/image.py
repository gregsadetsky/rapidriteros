import random
from base64 import b64encode
from pathlib import Path
from time import sleep

from flask import Flask, Response, request
from PIL import Image

IMAGE_PATH = Path("./recurse.png")

app = Flask(__name__)


@app.route("/render", methods=["POST"])
def render():
    def eventStream():
        while True:
            image = Image.open(IMAGE_PATH)
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
