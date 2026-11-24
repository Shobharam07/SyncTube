# SyncTube --- YouTube Watch Party

SyncTube is a room-based, full-stack web application that lets people
watch YouTube videos together with synchronized playback. Users create
or join a room, share a video, and interact through live chat and room
controls.

The application is built with **React, Vite, Node.js, Express,
Socket.IO, and the YouTube IFrame Player API**.

> **Project status:** Single-server MVP. Public deployment is not yet
> configured. Add the live Render URL below after deployment.

------------------------------------------------------------------------

## Table of Contents

-   [Key Features](#key-features)
-   [Technology Stack](#technology-stack)
-   [Requirements](#requirements)
-   [Getting Started](#getting-started)
-   [Production Build and Tests](#production-build-and-tests)
-   [How It Works](#how-it-works)
-   [Project Structure](#project-structure)
-   [Deployment on Render](#deployment-on-render)
-   [Testing](#testing)
-   [Known Limitations](#known-limitations)
-   [Future Improvements](#future-improvements)

------------------------------------------------------------------------

## Key Features

-   Create rooms with unique room codes and shareable invite links.
-   Join an existing room using its room code or invite link.
-   Host, Moderator, and Participant roles.
-   Synchronized YouTube play, pause, seek, and video changes.
-   Slider and numeric seek controls.
-   Participants can request playback actions.
-   Host and Moderator can approve or reject playback requests.
-   Host can promote or demote participants, remove participants, and
    transfer host privileges.
-   Live room chat, participant list, and presence updates.
-   Session-token-based reconnection with a 60-second grace period.
-   Periodic playback-state broadcasts to correct playback drift.
-   Server-side validation of room membership, roles, and event
    payloads.
-   Responsive user interface and object-oriented backend domain
    classes.

## Technology Stack

  Layer                     Technologies
  ------------------------- ------------------------------
  Frontend                  React, Vite, JavaScript, CSS
  Backend                   Node.js, Express
  Real-time communication   Socket.IO
  Video playback            YouTube IFrame Player API
  Testing                   Node.js test runner
  Deployment target         Render Web Service

## Requirements

-   Node.js 22
-   npm
-   Internet access to install dependencies and load embedded YouTube
    videos
-   VS Code or another code editor

The default single-server MVP does not require a database account, API
key, or `.env` file.

------------------------------------------------------------------------

## Getting Started

### 1. Extract and open the project

Extract the project ZIP and open the **`SyncTube-Pro`** folder in your
editor. Run all commands from the folder that contains the root
`package.json`.

### 2. Install dependencies

``` bash
npm install
```

### 3. Start the development servers

``` bash
npm run dev
```

The development command starts the Vite frontend and Express/Socket.IO
backend.

-   Frontend: <http://localhost:5173>
-   Backend: port `5000`

Use the Vite URL printed in the terminal if it differs from the default
URL.

### 4. Try a watch party

1.  Open the application and enter a display name.
2.  Create a room and note its room code.
3.  Open a second browser window, preferably an incognito window.
4.  Enter a different display name and join using the room code or
    invite link.
5.  As the Host, paste an embeddable YouTube URL and load the video.
6.  Test play, pause, seek, and changing the video.
7.  Test chat, participant roles, and playback requests from both
    windows.
8.  If browser autoplay is blocked, click **Enable synchronized
    playback** in the player.

Some YouTube videos do not allow embedding. A localhost invite link is
only accessible on the same device; use the deployed public URL for
users on other devices or networks.

------------------------------------------------------------------------

## Production Build and Tests

Run the automated tests:

``` bash
npm test
```

Create the production frontend build:

``` bash
npm run build
```

Start the production server:

``` bash
npm start
```

Open <http://localhost:5000>.

The Express server serves the compiled frontend and Socket.IO from the
same origin. The health endpoint is available at:

``` text
http://localhost:5000/api/health
```

The automated tests exercise the room domain and server event handlers
using simulated socket connections. They do not launch a browser or
connect to YouTube. See [`docs/TESTING.md`](docs/TESTING.md) for the
manual acceptance checklist.

------------------------------------------------------------------------

## How It Works

1.  **Application startup:** `main.jsx` mounts the React application.
    Express serves the application and initializes Socket.IO.
2.  **Socket connection:** The frontend connects to the server using the
    Socket.IO client.
3.  **Room creation and joining:** The client sends room events. The
    server creates or finds the room, validates membership, and adds the
    socket to the corresponding Socket.IO room.
4.  **Playback control:** A permitted controller sends a playback event.
    The server validates the user's role and room membership, updates
    the authoritative room state, and broadcasts the updated state.
5.  **Player synchronization:** Each client receives the shared state
    and applies the relevant action to its YouTube player through the
    IFrame Player API.
6.  **Playback requests:** Participants can submit requests. A Host or
    Moderator can approve or reject them.
7.  **Reconnection:** A returning guest can restore their session within
    the configured 60-second grace period.

The backend room state is authoritative for shared playback. The
application synchronizes playback controls and position; video content
itself is delivered directly by YouTube to each user's browser.

For more detail, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

------------------------------------------------------------------------

## Project Structure

``` text
SyncTube-Pro/
├── src/
│   ├── components/       # Video player, playback, participants, chat, requests
│   ├── pages/            # Home and watch room pages
│   ├── services/         # Socket.IO and YouTube API clients
│   ├── utils/            # Session, video URL, and time helpers
│   ├── App.jsx            # Application state and socket listeners
│   ├── main.jsx           # React entry point
│   └── style.css          # Responsive UI styles
├── server/
│   ├── domain/            # Room and Participant classes
│   ├── services/          # Room lifecycle and broadcasting
│   ├── sockets/
│   │   ├── handlers/      # Membership, playback, and chat events
│   │   └── registerEvents.js
│   ├── tests/             # Node test runner tests
│   └── index.js            # Express and Socket.IO entry point
├── docs/
│   ├── ARCHITECTURE.md    # Technical design and event contract
│   └── TESTING.md         # Acceptance tests and implementation limits
├── index.html
├── package.json
├── vite.config.js
├── render.yaml
└── README.md
```

------------------------------------------------------------------------

## Deployment on Render

The application can be deployed as **one Render Web Service** because
Express serves both the built React frontend and the Socket.IO server
from the same public origin.

### Option A: Create a Web Service manually

1.  Push the project source to a GitHub repository. Do not commit
    `node_modules/` or `dist/`.
2.  Sign in to [Render](https://dashboard.render.com/).
3.  Select **New → Web Service** and connect the GitHub repository.
4.  Configure the service:

  ----------------------------------------------------------------------------------
  Setting                             Value
  ----------------------------------- ----------------------------------------------
  Runtime                             Node

  Node version                        `22`

  Root Directory                      Leave blank when `package.json` is at the
                                      repository root

  Build Command                       `npm install --include=dev && npm run build`

  Start Command                       `npm start`

  Health Check Path                   `/api/health` (if the field is available)
  ----------------------------------------------------------------------------------

5.  Deploy the service and review the build and runtime logs.
6.  Open the HTTPS URL provided by Render.
7.  Check that the application loads and that `/api/health` responds
    successfully.
8.  Create a room and join it from another device or browser to verify
    real-time functionality.

Render provides the `PORT` environment variable. The server should
listen on `process.env.PORT` in production.

### Option B: Use the included Blueprint

The repository includes a `render.yaml` file. You can create a Render
Blueprint from the repository and review its configuration before
deploying.

### Deployment URL

**Live application:**
`Not deployed yet — add the public Render URL after deployment.`

**GitHub repository:** `Add the repository URL before final submission.`

------------------------------------------------------------------------

## Testing

The project includes automated server-side tests and a manual acceptance
checklist.

Before submission, verify:

-   [ ] `npm install` completes successfully.
-   [ ] `npm test` passes.
-   [ ] `npm run build` completes successfully.
-   [ ] `npm start` starts the production server.
-   [ ] The health endpoint responds successfully.
-   [ ] A Host can create a room and another user can join it.
-   [ ] Playback controls synchronize across two browser sessions.
-   [ ] Participants can request playback actions.
-   [ ] Host or Moderator can approve and reject requests.
-   [ ] Role management, chat, and participant removal work.
-   [ ] Reconnection works within the configured grace period.
-   [ ] The deployed application is tested from a second device or
    network.

See [`docs/TESTING.md`](docs/TESTING.md) for the project's detailed
testing notes.

------------------------------------------------------------------------

## Known Limitations

-   Rooms and guest sessions are stored in memory. A server restart or
    redeployment clears them.
-   This version is designed to run as a single server process.
-   Database-backed persistence, Redis, distributed Socket.IO scaling,
    and login accounts are not implemented.
-   The configured limits of 1,000 rooms and 50 members per room are
    application limits, not verified load-test results.
-   Playback synchronization is approximate, not frame-perfect. Network
    latency, buffering, advertisements, video availability, and browser
    autoplay restrictions can affect playback on individual devices.
-   Automated tests do not replace manual browser, multi-device, and
    YouTube playback testing.

## Future Improvements

-   Persistent room and session storage.
-   User authentication and account management.
-   Redis-backed Socket.IO scaling for multiple server instances.
-   Improved synchronization using latency measurements.
-   Automated browser-based end-to-end tests.
-   Load and reliability testing.

------------------------------------------------------------------------

## Acknowledgement

SyncTube was developed as a full-stack project to demonstrate frontend
development, backend design, real-time communication, role-based access
control, and synchronized media controls.
