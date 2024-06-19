import random
from base64 import b64encode
from time import sleep

from flask import Flask, Response, request
from PIL import Image

app = Flask(__name__)


@app.route("/render", methods=["POST"])
def render():
    def eventStream():
        frames = 1

        while True:
            # generate a 96 x 38 black and white 1 channel image
            # and fill it with random noise

            random_image = Image.new("1", (96, 38))
            random_image.putdata([random.randint(0, 1) for _ in range(96 * 38)])
            # get png data
            random_image_bytes = random_image.tobytes()
            # base64 encode
            random_image_base64 = b64encode(random_image_bytes).decode("utf-8")

            yield f"event: screen_update\ndata: {random_image_base64}\n\n"

            sleep(1)

            frames += 1
            if frames > 30:
                yield "event: end\n\n"
                break

    return Response(eventStream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=80, host="0.0.0.0")
