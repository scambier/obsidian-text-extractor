# Obsidian Text Extract Library

## Limitations

Text extraction does not work on mobile; calling the functions will just immediately return an empty string.

## Build

You'll need [Rust](https://doc.rust-lang.org/book/ch01-01-installation.html), [wasm-pack](https://github.com/rustwasm/wasm-pack), and [pnpm](https://pnpm.io/installation). 

```sh
$ pnpm i
$ pnpm run build
```

Rust is quite slow to compile, so the first build will take some time.