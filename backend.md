```markdown
# Backend Project Plan: Meme Slider App

**Role:** Backend Lead
**Architecture Note:** NO DATABASE REQUIRED. This app uses purely ephemeral, in-memory state. Everything is handled in real-time via WebSockets using Socket.io's built-in "Rooms" feature.

## Tech Stack
* **Core:** Node.js, Express
* **WebSockets:** `socket.io`
* **Middleware:** `cors`
* **Hosting:** Render, Railway, or Heroku

---

## Phase 1: Setup & Lobby (The Handshake)
**Goal:** Allow users to connect via WebSockets and group them into temporary 5-digit PIN "Rooms."

* **Server Setup:** Initialize Express and an HTTP server. Attach Socket.io to the server.
* **CORS Configuration:** Ensure CORS is permissive enough for the frontend domain to make REST and WebSocket requests.
* **REST Endpoint:** Create `GET /create-room`. It should generate a random 5-digit string and return it as JSON: `{ "roomPin": "12345" }`.
* **Socket - Join:** Listen for the `join-room` event from a client. Call `socket.join(pin)`.
* **Socket - Notify:** Once a user joins, broadcast a `partner-joined` event to that specific room to let the first user know someone arrived.

---

## Phase 2: Core Gameplay (The Bridge)
**Goal:** Act as the traffic controller. When Phone A swipes, tell Phone B instantly.

* **Socket - Listen:** Listen for the `slide-meme` event from a client.
* **Socket - Broadcast:** When `slide-meme` is received, use `socket.to(data.pin).emit('receive-meme', payload)`. 
* *Crucial Detail:* Using `socket.to()` automatically broadcasts to everyone in the room *except* the sender. This is perfect, as Phone A shouldn't receive the meme it just sent away.

---

## Phase 3: Cleanup & Edge Cases
**Goal:** Ensure the server doesn't memory leak and handles drops gracefully.

* **Disconnects:** Listen for the built-in `disconnect` event on the socket.
* **Logging:** Add console logs for rooms being created and sockets disconnecting to help with debugging during testing.
* *Note:* Socket.io automatically cleans up empty rooms from RAM, so you don't need to write custom garbage collection logic for the PINs!

---

## The API & WebSocket Contract
*Do not change these names or payloads without syncing with the Frontend Lead.*

### REST API Endpoints (You Provide)
| Method | Endpoint | Description | Response to Send |
| :--- | :--- | :--- | :--- |
| **GET** | `/create-room` | Fetches a new PIN. | `{ "roomPin": "12345" }` |

### WebSocket Events (You Listen For <- From Client)
| Event Name | Expected When | Expected Payload from Client |
| :--- | :--- | :--- |
| `join-room` | Client connects to a lobby. | `"12345"` (String) |
| `slide-meme` | Client swipes a meme off screen. | `{ pin: "12345", memeUrl: "link.jpg", direction: "right" }` |

### WebSocket Events (You Emit -> To Client)
| Event Name | Emitted When | Payload to Send to Client |
| :--- | :--- | :--- |
| `partner-joined` | A second client joins a room. | `{ message: "Partner connected!" }` |
| `receive-meme` | Forwarding the meme to the partner. | `{ memeUrl: "link.jpg", direction: "right" }` |

```