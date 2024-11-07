use axum::{
    response::sse::{Event, Sse},
    routing::get,
    Json, Router,
};
use futures::stream::{self, Stream};
use serde::{Deserialize, Serialize};
use std::{convert::Infallible, time::Duration};
use tokio_stream::StreamExt as _;
use wasmer::{imports, Instance, Memory, MemoryType, Module, Store, TypedFunction, Value, WasmPtr};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let app = Router::new().route("/render", get(render));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:80").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    let module_wat = r#"
    (module
      (type $t0 (func (param i32) (result i32)))
      (func $add_one (export "add_one") (type $t0) (param $p0 i32) (result i32)
        local.get $p0
        i32.const 1
        i32.add))
    "#;
    run_some_wasm(module_wat)
}

#[derive(Deserialize)]
struct Payload {
    wasm: String,
}

async fn render(
    Json(payload): Json<Payload>,
) -> anyhow::Result<Sse<impl Stream<Item = Result<Event, Infallible>>>> {
    // Okay, what's the API?
    // Worker hits /render
    // Expecting an event stream response
    // Each event is an image to render, e.g.
    // event: screen_update
    // data: <the base64-encoded image data>

    let mut store = Store::default();
    let module = Module::new(&store, payload.wasm)?;
    let memory = Memory::new(&mut store, MemoryType::new(1, None, false)).unwrap();
    let import_object = imports! {
        "env" => {
             "memory" => memory,
        }
    };
    let instance = Instance::new(&mut store, &module, &import_object)?;

    let next_frame: TypedFunction<(), (WasmPtr<u8>, u8)> =
        instance.exports.get_typed_function(&store, "next_frame")?;

    let (ptr, valid) = next_frame.call(&mut store)?;
    if valid == 0 {
        // Done!
    }
    let view = memory.view(&store);
    let img: [u8; 3648] = ptr.read(&view)?;

    // A `Stream` that repeats an event every second
    //
    // You can also create streams from tokio channels using the wrappers in
    // https://docs.rs/tokio-stream
    let stream = stream::repeat_with(|| Event::default().event("screen_update").data("hi!"))
        .map(Ok)
        .throttle(Duration::from_secs(1));

    Ok(Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(1))
            .text("keep-alive-text"),
    ))
}
