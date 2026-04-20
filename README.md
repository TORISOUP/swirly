<p align="center">
  <img alt="Swirly" src="https://user-images.githubusercontent.com/201034/82764045-6173da00-9e0c-11ea-9bee-4fb6543d977a.png" width="480">
</p>

<p align="center">
  A marble diagram generator, forked and maintained by TORISOUP.
</p>

<p align="center">
  <a href="https://standardjs.com"><img alt="JavaScript Standard Style" src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg"></a>
</p>

## About This Fork

This repository is TORISOUP's fork of
[timdp/swirly](https://github.com/timdp/swirly).

Fork version: `0.22.0-torisoup.0`

This fork keeps the original Swirly marble diagram syntax and adds local
improvements for diagram authoring:

- UTF-8-safe SVG and PNG export for labels that contain Japanese or other
  non-Latin characters.
- Dev Container setup for building and hosting the Web app locally.
- Message link notation for connecting related events across streams.

## Example

Here's Swirly rendering the effect of the `concatAll` operator:

![concatAll](examples/concatAll.png)

The image above was built from
[this marble diagram specification](examples/concatAll.txt).

Diagram specifications use an extension of the syntax used for
[RxJS marble testing](https://github.com/ReactiveX/rxjs/blob/fc3d4264395d88887cae1df2de1b931964f3e684/docs_app/content/guide/testing/marble-testing.md).
Please consult the [examples](examples.md) to learn how to create diagrams.

## Message Links

This fork adds a `[links]` block for drawing relationship lines between
messages:

```txt
----a------b------|
id = source

> Delay

--------x------y------|
id = target

[links]
source.a -- target.x
source.b -.-> target.y [layer=front, priority=10]
```

Supported connectors:

```txt
a -- x       solid line
a -.- x      dashed line
a --> x      forward arrow
a -.-> x     dashed forward arrow
a <-- x      reverse arrow
a <-.- x     dashed reverse arrow
a <--> x     bidirectional arrow
a <-.-> x    dashed bidirectional arrow
```

Links are rendered behind the diagram by default. Use `layer=front` to draw a
link in front of streams and operators. Use `priority` to control ordering
within the same layer.

See [examples/links.txt](examples/links.txt) for a complete sample.

## Local Web App

The easiest way to run the Web app is with the included Dev Container. Open the
repository in VS Code, choose "Reopen in Container", and access:

```text
http://localhost:8080/
```

The container installs dependencies, builds `@swirly/web`, and hosts the static
output from `packages/swirly-web/dist`.

You can also run it manually from the repository root:

```bash
yarn install --frozen-lockfile
yarn turbo run build --filter=@swirly/web...
cd packages/swirly-web/dist
python3 -m http.server 8080
```

## CLI From Source

Build the CLI and run it from the workspace:

```bash
yarn turbo run build --filter=swirly...
node packages/swirly/dist/cli.js examples/links.txt links.svg
```

Swirly can also output PNG images when a supported rasterizer is available:

```bash
node packages/swirly/dist/cli.js --scale=200 examples/links.txt links.png
```

## Original Project

Original project: [timdp/swirly](https://github.com/timdp/swirly)

Original author: [Tim De Pauw](https://tmdpw.eu)

Fork maintainer: TORISOUP

## License

MIT
