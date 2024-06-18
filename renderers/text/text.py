import random
from time import sleep

from flask import Flask, Response, request

app = Flask(__name__)


@app.route("/render", methods=["POST"])
def render():
    print("payload", request.json)

    def eventStream():
        expo_timeout = 1

        while True:
            # wait for source data to be available, then push it
            random_payload = random.random()
            yield f"event: screen_update\ndata: {random_payload}\n\n"

            sleep(1)

            expo_timeout += 1
            if expo_timeout > 5:
                yield "event: end\n\n"
                break

    return Response(eventStream(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=80, host="0.0.0.0")
