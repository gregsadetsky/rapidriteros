import queue
import random
import socket
import threading
from time import sleep

from flask import Flask, Response, request

Q = queue.Queue(maxsize=1)


def threaded_udp_server(port_as_int):
    print("UDP server is running...")
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server_socket.bind(("", port_as_int))

    while True:
        message, address = server_socket.recvfrom(1024)
        print(f"Received message: {message} from {address}")
        try:
            Q.put_nowait(message)
        except queue.Full:
            print("Queue is full, dropping message")


app = Flask(__name__)


@app.route("/render", methods=["POST"])
def render():
    print("payload", request.json)

    # empty queue
    while not Q.empty():
        gotten_message = Q.get()

    def eventStream():
        sent_frames = 0
        while True:
            print("blocking on the q.get...")
            try:
                queue_payload = Q.get_nowait()
            except queue.Empty:
                print("empty queue!!")
                sleep(0.01)
                continue

            print("...got a payload", queue_payload)

            yield f"event: screen_update\ndata: UDP {queue_payload}\n\n"
            # sent_frames += 1
            # if sent_frames > 5:
            #     yield "event: end\n\n"
            #     break

    return Response(eventStream(), mimetype="text/event-stream")


def main():
    udp_server_thread = threading.Thread(target=threaded_udp_server, args=(12000,))
    udp_server_thread.start()

    app.run(debug=True, threaded=True, port=6000, use_reloader=False)


if __name__ == "__main__":
    main()
