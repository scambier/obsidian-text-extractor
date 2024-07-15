# Obsidian Text Extract Library

## Limitations

Text extraction does not work on mobile; calling the functions will just immediately return an empty string.

## Build

You'll need [Rust], [wasm-pack], and [pnpm].

```sh
$ pnpm i
$ pnpm build
```

Rust is quite slow to compile, so the first build will take some time.

## Test

Unit tests use the fast [Vitest] library, and sit alongside code in the format `<name>.test.ts`. Run them continuously with:

```sh
$ pnpm test
```

Test coverage can be shown with:

```sh
$ pnpm coverage
```

[pnpm]: https://pnpm.io/installation
[Rust]: https://doc.rust-lang.org/book/ch01-01-installation.html
[Vitest]: https://vitest.dev/
[wasm-pack]: https://github.com/rustwasm/wasm-pack
