# Clearlink

Video calls that start with a link. Create a room, send the link, and talk in the browser: up to five people, no accounts, nothing to install.

Audio and video go straight between the browsers over WebRTC. A small Node server introduces people to each other and passes chat along, but never carries the call.

![A three-person Clearlink call with the chat panel open](docs/media/call.png)

![MIT licence](https://img.shields.io/badge/licence-MIT-5BC4CC) ![Node.js 20+](https://img.shields.io/badge/node-20%2B-5BC4CC)

## Features

- Invite links and eight-character room codes, up to five people per room
- Camera and microphone preview, device switching, mute and camera controls
- Group and spotlight views, with a self-view you can drag or hide
- Screen sharing on desktop
- In-call chat
- Desktop and phone layouts, dark and light themes, reduced-motion support

![The Clearlink start screen, and a call on a phone](docs/media/start-and-phone.png)

## Quick start

Needs [Node.js](https://nodejs.org) 20 or later.

```sh
npm install
npm start        # http://localhost:3001, for calls on this computer
npm run share    # a public https link, for calls with other devices
```

Both commands build the app first. Press Ctrl+C to stop.

`npm start` is enough to try it with two browser tabs. To call someone on another device, use `npm run share`. It needs Cloudflare's free [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) (on macOS, `brew install cloudflared`). Browsers only allow camera access on `localhost` or HTTPS, so other devices need the HTTPS address it prints.

If port 3001 is taken, use `PORT=3002 npm start`.

## How it works

![Browsers exchange media directly. The tunnel connects them to the Node room server; STUN helps them find a direct route.](docs/media/architecture.svg)

1. **Node serves the app and keeps track of rooms.** Rooms live in memory, hold up to five people, and close when everyone leaves.
2. **Browsers swap connection details through Node.** Offers, answers and network candidates travel over long-polling requests.
3. **STUN finds a direct route.** Each browser learns its public address from Cloudflare's STUN server, then the browsers test routes until one works.
4. **The call goes browser to browser.** Audio, video and screen sharing are encrypted and never pass through Node or the tunnel. Chat goes through Node, to whoever is in the room at the time.

Every person connects to every other person (a full mesh), which is why rooms stop at five. A few details that keep calls stable:

- **One offerer per pair.** The browser with the lower ID always starts the connection, so two browsers never collide by offering at once.
- **Late camera results are discarded.** Each camera or microphone request is numbered, and anything that arrives after you've left or switched devices is stopped straight away, so the camera light never stays on.
- **Retry restarts the route search** (an ICE restart) without dropping the call.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Port for the Node server |
| `HOST` | `127.0.0.1` | Address to listen on. Use `0.0.0.0` only if your host requires it |
| `ICE_SERVERS_JSON` | Cloudflare STUN | The full list of STUN/TURN servers given to browsers |

To add a TURN relay, include it in `ICE_SERVERS_JSON` with short-lived credentials. Browsers receive these credentials, so never use an admin secret:

```sh
ICE_SERVERS_JSON='[{"urls":"stun:stun.cloudflare.com:3478"},{"urls":"turn:turn.example.com:3478","username":"…","credential":"…"}]' npm start
```

To deploy permanently, run one Node process behind an HTTPS proxy. Keep `/api` on the same origin, don't cache it, and allow requests to stay open for at least 35 seconds.

## Limitations

- **No relay by default.** Networks that block direct connections, such as some workplace and university networks, can't connect without TURN.
- **Five people per room,** because each browser sends its media to every other person.
- **One server process.** Rooms are held in memory and are lost on restart.
- **Tested in Chrome.** The automated tests don't cover Safari or iOS.
- **The connection check at `/test` is simulated.** It shows what a real check will look like, not your actual network.

## Development

```sh
npm run server   # Node on port 3001
npm run dev      # Vite dev server, proxying /api to Node
```

Open `/?demo` to step through simulated room states without a second device.

`npm run lan:setup` and `npm run lan` serve the app over HTTPS on your local network with a test certificate, for trying it on a phone at home.

## Tests

```sh
npm test               # 12 Node tests
npm run test:browser   # Playwright + Google Chrome
```

The Node tests cover room membership and capacity, signalling, chat, ICE configuration and the camera-timing cases above. The browser test opens five Chrome sessions with simulated cameras, checks that real audio and video bytes arrive at every participant, confirms a sixth person is turned away, and covers chat, mute, leaving and rejoining. It needs Playwright: `npm install --no-save --package-lock=false playwright`.

Calls have also been tested by hand between devices on different networks, including mobile data, connecting directly with no relay.

## Project structure

```
server/            Node room server, signalling, chat, sharing and LAN scripts
src/services/      WebRTC connections, camera and microphone, demo-mode services
src/state/         app state and actions
src/screens/       start screen, camera check, call, chat, settings
src/components/    buttons, video tiles, control bar, panels
src/styles/        design tokens and styles
tests/             Node and browser tests
```

Fonts are IBM Plex, bundled locally under the OFL. The app makes no requests to font or icon services.

## Security and licence

See [SECURITY.md](SECURITY.md) for what Clearlink does and doesn't protect, and how to report an issue.

[MIT](LICENSE) © 2026 George Nicholson
