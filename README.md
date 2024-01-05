<p align="center">
   <img alt="CoW Protocol Logo" width="400" src="./.github/cow.png">
</p>

# CoW Tutorials

A grass-to-glass tutorial on how to build with CoW Protocol.

## Setup

This repo uses [yarn](https://yarnpkg.com/).

## Developing the app

First, run `node scripts/create-common-bundle`. This packages up everything that's needed to run the app within the webcontainer (Vite, typescript, CoW dependencies, etc.) which can subsequently be unpacked on a server to create and run an instance of a CoW application (which powers the output window of the tutorial). Then, run `dev`:

```bash
node scripts/create-common-bundle
yarn dev
```

To build for production and run locally:

```bash
yarn build
yarn preview
```

## Creating new tutorials

Tutorials live inside `content`. Each tutorial consists of a `README.md`, which is the text to the left, and `app-a` and `app-b` folders, which represent the initial and solved state. Files that stay the same can be omitted from `app-b`. Files are marked as deleted in `app-b` if they start with `__delete`. Folders that are marked as deleted in `app-b` if they contain a file named `__delete`.

## Bumping tutorial dependencies

Bump the dependency (for example `cow-sdk`) in both the root and the `content/common` `package.json`. In the root do `yarn` (to update `yarn.lock`), in `content/common` do `yarn` (to update `yarn.lock`).
