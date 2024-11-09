FROM rust:1.82.0 AS builder

RUN rustup target add x86_64-unknown-linux-musl
RUN USER=root cargo new --bin app
WORKDIR /app

COPY Cargo.toml Cargo.lock ./

# Cache dependencies against the dummy build
RUN cargo build --release --target=x86_64-unknown-linux-musl

# Remove the dummy source and any binary deps. Something about timestamps (or
# something?) causes the second `cargo build` to not actually rebuild anything.
RUN rm src/*.rs target/x86_64-unknown-linux-musl/release/deps/wasm-*

COPY ./src ./src

# Do the real build
RUN cargo build --release --target=x86_64-unknown-linux-musl

FROM alpine
WORKDIR /app

COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/wasm .
USER 1000
CMD ["/app/wasm"]
