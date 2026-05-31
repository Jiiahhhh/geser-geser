# Frontend Project Plan: Meme Slider App

**Role:** Frontend Lead
**Architecture Note:** This app is entirely real-time. There is NO database. We are using WebSockets to instantly send data back and forth.

## Tech Stack
* **Core:** HTML/CSS/JS (or React/Vue depending on your preference)
* **WebSockets:** `socket.io-client`
* **Gestures & Animation:** CSS Transforms, plus a library like Framer Motion (if React) or Hammer.js (if Vanilla JS) for detecting swipe velocity.
* **Hosting:** Vercel or Netlify

---

## Phase 1: Lobby & Connection (The Handshake)
**Goal:** Build the UI to get a user into a socket "Room."

* **UI - Home Screen:** Needs two primary buttons: "Create Room" and "Join Room".
* **Flow - Create:** When tapped, hit the Backend REST API (`GET /create-room`). Display the returned 5-digit PIN in large text. Connect to Socket.io and emit `join-room` with that PIN.
* **Flow - Join:** Show a number pad/input for a 5-digit PIN. Connect to Socket.io and emit `join-room` with the entered PIN.
* **UI - Waiting State:** Show a "Waiting for partner..." screen until the `partner-joined` socket event fires.

---

## Phase 2: Core Gameplay (The Slide)
**Goal:** Swiping a meme on this phone makes it disappear and tells the backend to send it to the other phone.

* **Meme Sourcing:** Hardcode an array of image URLs or fetch from a free meme API to populate the feed.
* **Swipe Detection:** Listen for touch events. Calculate swipe direction (left/right) and velocity.
* **Outbound Animation:** If the swipe passes a distance/speed threshold, trigger a CSS animation (`transform: translateX(100vw)`) to slide the image off-screen smoothly.
* **Emit Event:** The exact millisecond the outward animation starts, emit the `slide-meme` socket event to the backend.
* **Inbound Animation:** Listen for the `receive-meme` socket event. When triggered, place the new image off-screen (`translateX(-100vw)`), then animate it into the center.

---

## Phase 3: Polish & Edge Cases
**Goal:** Make it feel smooth like a native app.

* **Gesture Locks:** Use CSS (`touch-action: none`) and JS (`e.preventDefault()`) to stop the browser's default "swipe to go back" or "pull to refresh" behaviors.
* **Pre-loading:** Pre-load the next few meme images in a hidden `<img>` tag so they don't pop up blank mid-animation.
* **Disconnects:** Listen for socket disconnections and show a "Connection Lost" modal.

---

## The API & WebSocket Contract
*Do not change these names or payloads without syncing with the Backend Lead.*

### REST API Endpoints (Call these via `fetch`)
| Method | Endpoint | Description | Expected Response |
| :--- | :--- | :--- | :--- |
| **GET** | `/create-room` | Fetches a new PIN. | `{ "roomPin": "12345" }` |

### WebSocket Events (You Emit -> To Server)
| Event Name | Sent When | Payload Sent to Server |
| :--- | :--- | :--- |
| `join-room` | You enter a PIN or generate one. | `"12345"` (String) |
| `slide-meme` | You swipe a meme off the screen. | `{ pin: "12345", memeUrl: "link.jpg", direction: "right" }` |

### WebSocket Events (You Listen For <- From Server)
| Event Name | Received When | Payload Received from Server |
| :--- | :--- | :--- |
| `partner-joined` | The second phone enters the room. | `{ message: "Partner connected!" }` |
| `receive-meme` | Partner swiped a meme to you. | `{ memeUrl: "link.jpg", direction: "right" }` |