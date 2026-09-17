# Stanza

A private songwriter’s desk. Write verses and choruses on lined paper, keep notes beside the chart, and ask a co-writer that runs **entirely on your machine**.

No cloud APIs. No hosted models. Lyrics never leave the device.

## QVAC SDK

This app is built for Tether’s QVAC bounty: a local AI app using the JS SDK.

| | |
|---|---|
| Package | `@qvac/sdk` **0.19.1** (`>= 0.19.0`) |
| Functions used | `loadModel`, `completion` |
| Model | Qwen3 0.6B Instruct Q4 (`QWEN3_600M_INST_Q4`) |
| Inference | On-device only |

The web app loads the model and streams tokens in [`src/lib/qvac/engine.server.ts`](src/lib/qvac/engine.server.ts). The same `loadModel` + `completion` path is also available as a CLI in [`qvac/co-writer.mjs`](qvac/co-writer.mjs).

## Requirements

- Node.js `>= 22.17`
- npm `>= 10.9`
- A few hundred MB of disk for the first local model download (~382 MB). Later runs reuse the cache.

## Install

```bash
git clone https://github.com/jdtrades/stanza.git
cd stanza
npm install
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Pick a song, or start a new one.
2. Write a line on the paper.
3. Click **Continue this section** (or chorus / rewrite / draft).

The first generate downloads the QVAC model. Later generates reuse it.

Songs stay in `localStorage` on this machine.

## CLI (QVAC only)

```bash
echo '{"action":"draft","song":{"title":"Wire Fence","genre":"folk","mood":"dusk","key":"G","bpm":84,"notes":"","sections":[]},"focusSectionIndex":0,"instruction":"leaving town at dusk"}' \
  | QVAC_CONFIG_PATH=./qvac.config.json npm run cowrite
```

## What it is not

- Not a fork of [tetherto/qvac-examples](https://github.com/tetherto/qvac-examples).
- Not a cloud wrapper. There is no OpenAI / Anthropic / Groq / Grok path.

## License

MIT. QVAC itself is Apache-2.0 and remains a declared dependency.
