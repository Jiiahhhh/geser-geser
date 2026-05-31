import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import MemeCard from './components/MemeCard';
import { shuffledMemes } from './memes';

const BACKEND_URL = 'http://localhost:5001';

function App() {
  // ── Meme state ──────────────────────────────────────────────
  const [memeQueue,     setMemeQueue]     = useState(() => shuffledMemes());
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [sentCount,     setSentCount]     = useState(0);
  // Incoming meme from partner — key changes to force MemeCard remount
  const [incomingMeme,  setIncomingMeme]  = useState(null); // { url, key }

  // ── Socket / room state ─────────────────────────────────────
  const [pin,         setPin]         = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef(null);

  // ── Auto-connect on mount ───────────────────────────────────
  useEffect(() => {
    autoConnect();
    return () => socketRef.current?.disconnect();
  }, []);

  const autoConnect = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/create-room`);
      const data = await res.json();
      if (data.roomPin) {
        setPin(data.roomPin);
        initSocket(data.roomPin);
      }
    } catch {
      setPin('DEMO'); // backend offline → preview mode, gameplay still works
    }
  };

  const initSocket = (roomPin) => {
    const socket = io(BACKEND_URL, { reconnectionAttempts: 3 });
    socketRef.current = socket;

    socket.on('connect',        () => { socket.emit('join-room', roomPin); setSocketReady(true); });
    socket.on('partner-joined', () => setSocketReady(true));
    socket.on('disconnect',     () => setSocketReady(false));

    socket.on('receive-meme', (data) => {
      // Use a timestamp key to force a new MemeCard remount each time
      setIncomingMeme({ url: data.memeUrl, key: Date.now() });
    });
  };

  // ── Swipe handler ───────────────────────────────────────────
  const handleSwipeUp = () => {
    const meme = memeQueue[currentIndex];
    if (!meme) return;

    if (socketRef.current?.connected && pin && pin !== 'DEMO') {
      socketRef.current.emit('slide-meme', {
        pin,
        memeUrl:   meme.url,
        direction: 'up',
      });
    }

    setSentCount((c) => c + 1);
    setCurrentIndex((i) => i + 1);
  };

  // ── Incoming dismiss (user swipes it away) ──────────────────
  const handleDismissIncoming = () => setIncomingMeme(null);

  // ── Derived ─────────────────────────────────────────────────
  const currentMeme  = memeQueue[currentIndex];
  const isQueueDone  = !currentMeme;
  const preloadUrls  = memeQueue.slice(currentIndex + 1, currentIndex + 4);

  return (
    <div className="game-screen">

      {/* Hidden preload images */}
      {preloadUrls.map((m) => (
        <img key={m.id} src={m.url} alt="" style={{ display: 'none' }} aria-hidden />
      ))}

      {/* ── Top bar ──────────────────────────────────────── */}
      <header className="game-topbar">
        <span className="game-logo">🍃 Geser Geser</span>
        {pin && (
          <span className={`room-chip${socketReady ? ' room-chip--live' : ''}`}>
            {socketReady && <span className="room-chip__dot" />}
            {pin === 'DEMO' ? 'Preview' : `Room ${pin}`}
          </span>
        )}
      </header>

      {/* ── Meme area ────────────────────────────────────── */}
      <main className="meme-stack-area">
        {isQueueDone ? (
          <div className="queue-done">
            <span style={{ fontSize: '3.5rem' }}>🌾</span>
            <p className="queue-done__title">All memes sent!</p>
            <p className="queue-done__sub">You slid through everything 🎉</p>
            <button
              className="btn-restart"
              onClick={() => { setMemeQueue(shuffledMemes()); setCurrentIndex(0); setSentCount(0); }}
            >
              Shuffle &amp; Restart
            </button>
          </div>
        ) : (
          /* Current meme — user swipes this UP to send */
          <MemeCard
            key={`own-${currentMeme.id}`}
            meme={currentMeme}
            onSwipeUp={handleSwipeUp}
          />
        )}

        {/* Incoming meme — drops in from the top, swipe up to dismiss */}
        {incomingMeme && (
          <MemeCard
            key={`incoming-${incomingMeme.key}`}
            meme={{ url: incomingMeme.url, alt: 'From partner' }}
            incoming
            onSwipeUp={handleDismissIncoming}
          />
        )}
      </main>

      {/* ── Footer hint ──────────────────────────────────── */}
      {!isQueueDone && (
        <footer className="game-footer">
          <span className="swipe-hint">↑ swipe up to send</span>
          {sentCount > 0 && (
            <span className="sent-count">{sentCount} sent</span>
          )}
        </footer>
      )}

    </div>
  );
}

export default App;
