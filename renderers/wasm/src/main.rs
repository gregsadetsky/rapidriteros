use axum::{
    extract::DefaultBodyLimit,
    response::sse::{Event, Sse},
    routing::post,
    Json, Router,
};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use futures::stream::Stream;
use serde::Deserialize;
use std::{convert::Infallible, time::{SystemTime, UNIX_EPOCH, Duration}};
use tokio_stream::StreamExt;
use wasmer::{imports, Instance, Module, Store, Value, Function};


#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let app = Router::new()
        .route("/render", post(render))
        // Increase body limit to 50MB to handle large WAT files
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:80").await.unwrap();
    let _ = axum::serve(listener, app).await;

    Ok(())
}

#[derive(Deserialize)]
struct Payload {
    wasm: String,
}

struct WasmRunner {
    store: Store,
    instance: Instance,

    i: u16,
    returned_end: bool,
}

impl WasmRunner {
    fn new_from_wasm(payload: &str) -> anyhow::Result<WasmRunner> {
        let mut store = Store::default();
        let module = Module::new(&store, payload)?;
        let mytimefunc = || SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        let import_object = imports! {
            "env" => {
                "unixtime" => Function::new_typed(&mut store, mytimefunc),
            }
        };
        let instance = Instance::new(&mut store, &module, &import_object)?;

        Ok(WasmRunner {
            store,
            instance,
            i: 0,
            returned_end: false,
        })
    }
}

// ~10 fps
const FRAME_DURATION: Duration = Duration::from_millis(1000 / 10);

impl Iterator for WasmRunner {
    type Item = Result<Event, Infallible>;

    fn next(&mut self) -> Option<Self::Item> {
        if self.returned_end {
            return None;
        }
        // At 10 fps, 100 frames is 10 seconds, that should be enough animation
        // for anyone.
        if self.i > 100 {
            self.returned_end = true;
            return Some(Ok(Event::default().event("end")));
        }

        let mut img = [0; 456];
        let memory = self.instance.exports.get_memory("memory").unwrap();
        {
            let view = memory.view(&self.store);
            view.write(1, &img).unwrap();
        }

        let next_frame_fn = self.instance.exports.get_function("next_frame").unwrap();

        let done = next_frame_fn
            .call(
                &mut self.store,
                &[Value::I32(self.i as i32), Value::I32(1 as i32)],
            )
            .unwrap();
        if let Value::I32(v) = done[0] {
            if v == 1 {
                self.returned_end = true;
                return Some(Ok(Event::default().event("end")));
            }
        }
        self.i += 1;
        let view = memory.view(&self.store);
        view.read(1, img.as_mut_slice()).unwrap();

        // Write the image out
        return Some(Ok(Event::default()
            .event("screen_update")
            .data(STANDARD.encode(&img))));
    }
}

async fn render(
    Json(payload): Json<Payload>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    // Okay, what's the API?
    // Worker hits /render
    // Expecting an event stream response
    // Each event is an image to render, e.g.
    //
    // event: screen_update
    // data: <the base64-encoded image data>
    //
    // And then it ends with:
    // event: end
    //

    let runner = WasmRunner::new_from_wasm(&payload.wasm).unwrap();
    let stream = tokio_stream::iter(runner).throttle(FRAME_DURATION);

    Sse::new(stream)
}
