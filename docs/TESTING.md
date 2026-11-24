# Testing and submission checklist

## Automated checks

Run `npm test`. The five included tests cover domain validation and simulated socket event flows: role enforcement, room creation, playback updates, requests, approvals, rejections, participant removal, chat, host transfer, room isolation, late joins and reconnection. These are not real network or browser integration tests.

At packaging time, five tests passed and JavaScript/JSX source syntax was checked. Dependencies could not be installed in the packaging environment because the npm cache did not contain the required packages. A Vite production build, live YouTube playback and real WebSocket transport remain unverified here.

## Manual acceptance tests

| Test | Expected result |
|---|---|
| Host creates room | Unique code; creator shown as Host |
| Guest joins through code | Same room and Participant role |
| Guest joins via invite URL | Room code prefilled |
| Host loads YouTube video | Same video ID on all players |
| Host plays or pauses | All players follow, subject to autoplay/buffering |
| Host drags seek slider | Other players move to chosen position |
| Host changes video | Everyone gets the replacement video |
| Participant requests play/pause/seek/change | No shared playback change before approval |
| Host or Moderator approves request | Shared playback changes; requester receives notice |
| Host or Moderator rejects request | Shared playback remains unchanged |
| Host promotes/demotes a member | Role and controls update in all clients |
| Moderator attempts host-only action | Server rejects it |
| Participant attempts direct playback event | Server rejects it |
| Host removes participant | Removed client returns home; old token cannot rejoin |
| Host transfers role | New host gains management permissions |
| Two users chat | Messages appear in the same room |
| Late joiner enters while playing | Player starts near the current position |
| Connection drops briefly | Session and role restore within grace period |
| Another room is active | Its state and chat remain independent |
| Invalid URL or non-embeddable video | Validation or player error notice appears |
| Mobile viewport | Controls and panels fit the screen |
| Public deployment | Two separate devices can connect and synchronize |

## Submission gate

- Install dependencies and run the local tests and production build.
- Complete the manual acceptance checklist with two browsers.
- Deploy to a public WebSocket-capable service and test two devices.
- Update the README with the actual live URL.
- Be ready to explain the architecture, role checks and synchronization trade-offs.

Database persistence, authentication, reactions and distributed scaling are optional bonuses and are not part of this single-server MVP. Host transfer, chat and OOP are included. The source package does not claim a completed public deployment or verified production performance.
