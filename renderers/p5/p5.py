import base64
import io
import subprocess
from pathlib import Path
from time import sleep

from flask import Flask, Response, request
from PIL import Image

app = Flask(__name__)

SUBRENDERER_JS_PATH = Path(__file__).parent / "subrenderer" / "offline-canvas-p5.js"
# TODO remove
# TODO remove
# TODO remove
TMP_PROGRAM_PATH = Path(__file__).parent / "subrenderer" / "tmp-p5-program.js"


# TODO remove GET
# TODO remove GET
# TODO remove GET
@app.route("/render", methods=["GET", "POST"])
def render():
    # TODO get program string as arg!!!
    # TODO get program string as arg!!!
    # TODO get program string as arg!!!

    # TODO write program string to temporary file
    # TODO write program string to temporary file
    # TODO write program string to temporary file

    def eventStream():
        proc = subprocess.Popen(
            ["node", SUBRENDERER_JS_PATH, TMP_PROGRAM_PATH], stdout=subprocess.PIPE
        )

        while True:
            line = proc.stdout.readline()
            if not line:
                break

            raw_data = line.rstrip()
            if not raw_data:
                continue

            # unbase64
            image_data = base64.b64decode(raw_data)
            # load image from png data
            image = Image.open(io.BytesIO(image_data))

            # convert to 1-bit mode --- should we ditter here????????
            image = image.convert("1")
            image_bytes = image.tobytes()
            image_base64 = base64.b64encode(image_bytes).decode("utf-8")

            yield f"event: screen_update\ndata: {image_base64}\n\n"

        sleep(1)
        yield "event: end\n\n"

    return Response(eventStream(), mimetype="text/event-stream")
    # p5_to_render = request.json["p5"]
    # log.info("Rendering p5: %s", p5_to_render)


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=80, host="0.0.0.0")
