# Architecture and code walkthrough

## Request flow

```mermaid
flowchart TD
  A[Host or moderator UI] -->|play pause seek change video|
  B[Socket.IO server]
  P[Participant UI] -->|request_action| B
  B --> C[Validate socket identity and role]
  C --> D[Room service and Room state]
  D -->|room_update or sync_state| E[All room members]
  E --> F[YouTube IFrame player]
```

React manages UI state, room membership and the current server snapshot. Express serves the React production build and the health endpoint. Socket.IO uses WebSocket transport to carry bidirectional messages without polling for each action. The browser plays the YouTube video independently through the YouTube IFrame API; video media is not relayed through the application server.

`Participant` creates a random session token and maintains the participant's current socket identity, role and connection status. `Room` stores members, playback state, chat and requests. `RoomService` manages room creation, joins, session restoration, departure, removal and broadcasts. Event handlers call the service and the domain class only after validating the relevant permissions.

## Roles

| Permission              | Host       | Moderator  | Participant |
| ----------------------- | ---------- | ---------- | ----------- |
| Watch and chat          | Yes        | Yes        | Yes         |
| Shared playback control | Yes        | Yes        | No          |
| Submit playback request | Not needed | Not needed | Yes         |
| Approve or reject       | Yes        | Yes        | No          |
| Assign role             | Yes        | No         | No          |
| Remove user             | Yes        | No         | No          |
| Transfer host           | Yes        | No         | No          |

The server never trusts a client-supplied role. The `current()` service method checks room membership, current socket ID and online state. A private session token can restore identity after a network interruption; it is never included in the public member list. The room code is an invitation, not an authentication credential for host rights.

## Event contract

Each client event is sent with a payload and acknowledgement callback. Successful responses include `ok: true`; invalid actions include `ok: false` and an error message.

| Client event       | Payload                        | Permission                                |
| ------------------ | ------------------------------ | ----------------------------------------- |
| create_room        | name                           | Any connected guest not already in a room |
| join_room          | roomId, name; or roomId, token | Guest or returning member                 |
| leave_room         | empty object                   | Member                                    |
| play / pause       | empty object                   | Host or Moderator                         |
| seek               | value (seconds)                | Host or Moderator                         |
| change_video       | value (YouTube ID)             | Host or Moderator                         |
| request_action     | action, value                  | Participant                               |
| resolve_request    | id, approve (boolean)          | Host or Moderator                         |
| assign_role        | userId, role                   | Host                                      |
| remove_participant | userId                         | Host                                      |
| transfer_host      | userId                         | Host                                      |
| chat               | text                           | Member                                    |

The server sends `room_update` for membership, role and request changes, `sync_state` for playback changes and periodic correction, `chat_update` for chat, `removed` for a terminated session and `notice` for request decisions. These consolidate the PDF's suggested membership/role broadcasts into one room snapshot event. Seek and change_video also accept the PDF's `time` and `videoId` fields respectively.

## Playback algorithm

The room stores video ID, playing flag, position in seconds, update timestamp and action revision. While playing, the current target is the saved position plus elapsed server time. A pause freezes the target; a seek replaces it; changing the video resets the position and pauses it. Each accepted action increments the revision. The server sends its authoritative snapshot to all sockets in the room.

The client estimates elapsed time since the snapshot arrived, loads or cues the video, and calls `playVideo`, `pauseVideo` and `seekTo` to match shared state. Explicit seek and pause revisions force a position update, while routine drift correction seeks only when the difference exceeds 1.5 seconds. The server publishes a snapshot every five seconds, and the client checks its player every two seconds. This does not measure precise network latency or guarantee frame-perfect playback.

## Deployment and scale

Vite forwards WebSocket and API requests to Express during local development. In production, one Express process serves both React and Socket.IO on the same HTTPS origin. A single process is intentional for this assignment. Horizontal scaling would require a shared authoritative room store, distributed session handling, a Redis Socket.IO adapter and independent load testing. Merely configuring a room limit does not demonstrate concurrency capacity.
