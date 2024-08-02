import base64
import io
import subprocess
import tempfile
from pathlib import Path
from time import sleep

from flask import Flask, Response, request
from PIL import Image

app = Flask(__name__)

SUBRENDERER_JS_PATH = Path(__file__).parent / "subrenderer" / "shader-nogl-renderer.js"


@app.route("/render", methods=["POST"])
def render():
    # get program string as arg
    program_to_render = request.json["shader"]

    # write program to temporary file
    TMP_PROGRAM_PATH = (Path(tempfile.mkdtemp()) / "program.js").resolve()
    with open(TMP_PROGRAM_PATH, "w") as f:
        f.write(program_to_render)

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
            # invert the image white/black
            # image = Image.eval(image, lambda x: not x)
            image_bytes = image.tobytes()
            image_base64 = base64.b64encode(image_bytes).decode("utf-8")

            yield f"event: screen_update\ndata: {image_base64}\n\n"

        # delete temporary program file
        TMP_PROGRAM_PATH.unlink()

        sleep(0.1)
        yield "event: end\n\n"

    return Response(eventStream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=80, host="0.0.0.0")
