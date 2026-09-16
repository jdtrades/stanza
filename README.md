# Stanza

A private songwriter’s desk. Write verses and choruses on paper, keep notes beside the chart, and ask a co-writer to continue a section, draft a chorus, or sketch a whole song.

## Co-writer

Stanza tries **on-device** inference first with [Tether QVAC](https://qvac.tether.io) (`@qvac/sdk` 0.19.1, Qwen3 0.6B Instruct Q4). If the local worker cannot start (common in hosted previews), it writes with **Grok** instead.

| Path | When |
| --- | --- |
| QVAC `loadModel` + `completion` | Running on your machine with Node 22+ |
| Grok | Hosted preview / when the QVAC worker fails to start |

CLI (QVAC only):

```bash
echo '{"action":"draft","song":{"title":"Wire Fence","genre":"folk","mood":"dusk","key":"G","bpm":84,"notes":"","sections":[]},"focusSectionIndex":0,"instruction":"leaving town at dusk"}' \
  | QVAC_CONFIG_PATH=./qvac.config.json node qvac/co-writer.mjs
```

## Requirements

- Node.js `>= 22.17`
- npm `>= 10.9`
- A few hundred MB of disk for the first local model download (~382 MB)

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

Open the app, pick a song, write a line, then use **Continue this section**. On your computer the first generate downloads the QVAC model; later takes reuse it.

## License

MIT. QVAC itself is Apache-2.0 and remains a declared dependency.
