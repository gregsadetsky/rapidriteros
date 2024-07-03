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
                "96x",
                "-pointsize",
                "8",
                "-font",
                # absolute path to font
                FONT_PATH.resolve(),
                f"caption:{text_to_render}",
                "/tmp/out.png",
            ]
        )

        # imagemagic will return images of 96px of width BUT NOT NECESSARILY
        # 38 pixels high. if we are less than 38 pixels high, pad with black pixels
        # and send it back

        image = Image.open("/tmp/out.png")
        # convert to 1 mode
        image = image.convert("1")

        all_images_to_send = []

        # if image is less than or exactly 38 pixels high, pad with black pixels
        # (it's better than creating two images if the output is already 38px high)
        if image.height <= 38:
            new_image = Image.new("1", (96, 38), 0)
            new_image.paste(image, (0, 0))
            all_images_to_send = [new_image]
        else:
            # if more than 38 pixels high,
            # extract 38 pixels from the top, then shift y by 1 pixel,
            # get 38 pixels, etc. until the end of the image
            for y in range(0, image.height - 38):
                new_image = image.crop((0, y, 96, y + 38))
                all_images_to_send.append(new_image)

        if len(all_images_to_send) > 2:
            # make 5 copies of first frame so that scrolling doesn't begin immediately
            # when frames are shown
            all_images_to_send = [all_images_to_send[0]] * 10 + all_images_to_send

        for image in all_images_to_send:
            # get png data
            image_bytes = image.tobytes()
            # base64 encode
            image_base64 = b64encode(image_bytes).decode("utf-8")

            yield f"event: screen_update\ndata: {image_base64}\n\n"
            sleep(0.1)

        sleep(1)

        yield "event: end\n\n"

    return Response(eventStream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=80, host="0.0.0.0")
