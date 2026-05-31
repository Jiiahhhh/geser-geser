import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Sparkles, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import MemeCard from './components/MemeCard';
import { shuffledMemes } from './memes';

const BACKEND_URL = 'http://localhost:5001';

function App() {
  // ── Navigation ──────────────────────────────────────────────
  const [step, setStep] = useState('home'); // 'home' | 'join' | 'waiting' | 'game'

  // ── Room / socket ───────────────────────────────────────────
  const [pin,         setPin]         = useState('');
  const [inputPin,    setInputPin]    = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef(null);

  // ── Meme / gameplay ─────────────────────────────────────────
  const [memeQueue,    setMemeQueue]    = useState(() => shuffledMemes());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentCount,    setSentCount]    = useState(0);
  const [incomingMeme, setIncomingMeme] = useState(null); // { url, key }

  // ── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => socketRef.current?.disconnect();
  }, []);

  // ── Socket init ─────────────────────────────────────────────
  const initSocket = (roomPin) => {
    const socket = io(BACKEND_URL, { reconnectionAttempts: 3 });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', roomPin);
      setSocketReady(true);
    });

    socket.on('partner-joined', () => {
      setSocketReady(true);
      setStep('game');
    });

    socket.on('receive-meme', (data) => {
      setIncomingMeme({ url: data.memeUrl, key: Date.now() });
    });

    socket.on('disconnect', () => setSocketReady(false));
  };

  // ── Create Room ─────────────────────────────────────────────
  const handleCreateRoom = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/create-room`);
      const data = await res.json();
      if (data.roomPin) {
        setPin(data.roomPin);
        setStep('waiting');
        initSocket(data.roomPin);
      }
    } catch {
      alert('Cannot reach the server. Make sure the backend is running on ' + BACKEND_URL);
    }
  };

  // ── Join Room ───────────────────────────────────────────────
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (inputPin.length !== 5) return;
    setPin(inputPin);
    initSocket(inputPin);
    setStep('waiting');
  };

  // ── Swipe up → send meme ────────────────────────────────────
  const handleSwipeUp = () => {
    const meme = memeQueue[currentIndex];
    if (!meme) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit('slide-meme', { pin, memeUrl: meme.url, direction: 'up' });
    }

    setSentCount((c) => c + 1);
    setCurrentIndex((i) => i + 1);
  };

  const handleDismissIncoming = () => setIncomingMeme(null);

  // ── Derived ─────────────────────────────────────────────────
  const currentMeme = memeQueue[currentIndex];
  const isQueueDone = !currentMeme;
  const preloadUrls = memeQueue.slice(currentIndex + 1, currentIndex + 4);

  return (
    <>
      {/* ════════════════════════════════
          LOBBY SCREENS (glass card)
      ════════════════════════════════ */}
      {step !== 'game' && (
        <div className="glass-card">

          {/* ── Home ── */}
          {step === 'home' && (
            <div>
              <span className="emoji-badge">🍃</span>
              <div className="title-gradient">Geser Geser</div>
              <p className="subtitle">Swipe memes in real-time<br />with your partner!</p>

              <div className="divider-leaf">start a session</div>

              <button id="btn-create-room" className="btn btn-primary" onClick={handleCreateRoom}>
                <Sparkles size={17} />
                Create Room
              </button>

              <button id="btn-join-room" className="btn btn-secondary" onClick={() => setStep('join')}>
                <Users size={17} />
                Join Room
              </button>
            </div>
          )}

          {/* ── Join: PIN input ── */}
          {step === 'join' && (
            <form onSubmit={handleJoinRoom}>
              <button
                type="button"
                className="btn-back"
                onClick={() => { setStep('home'); setInputPin(''); }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="title-gradient" style={{ fontSize: '2rem' }}>Enter PIN</div>
              <p className="subtitle">Ask your partner for their 5-digit code</p>

              <input
                id="input-pin"
                type="text"
                inputMode="numeric"
                className="input-pin"
                placeholder="00000"
                maxLength={5}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={inputPin.length !== 5}
              >
                Join Room <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ── Waiting for partner ── */}
          {step === 'waiting' && (
            <div>
              <span className="emoji-badge" style={{ fontSize: '2.4rem' }}>🌿</span>
              <div className="title-gradient" style={{ fontSize: '2rem' }}>Room Ready</div>
              <p className="subtitle">Share this code with your partner<br />to start sliding</p>

              <div className="pin-display">{pin}</div>

              <div className="waiting-spinner" />
              <p className="text-muted">Waiting for partner to join…</p>
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════
          GAME SCREEN (full viewport)
      ════════════════════════════════ */}
      {step === 'game' && (
        <div className="game-screen">

          {/* Preload next images */}
          {preloadUrls.map((m) => (
            <img key={m.id} src={m.url} alt="" style={{ display: 'none' }} aria-hidden />
          ))}

          {/* Top bar */}
          <header className="game-topbar">
            <span className="game-logo">🍃 Geser Geser</span>
            <span className={`room-chip${socketReady ? ' room-chip--live' : ''}`}>
              {socketReady && <span className="room-chip__dot" />}
              Room {pin}
            </span>
          </header>

          {/* Meme area */}
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
              <MemeCard
                key={`own-${currentMeme.id}`}
                meme={currentMeme}
                onSwipeUp={handleSwipeUp}
              />
            )}

            {/* Partner's incoming meme drops in from top */}
            {incomingMeme && (
              <MemeCard
                key={`incoming-${incomingMeme.key}`}
                meme={{ url: incomingMeme.url, alt: 'From partner' }}
                incoming
                onSwipeUp={handleDismissIncoming}
              />
            )}
          </main>

          {/* Footer */}
          {!isQueueDone && (
            <footer className="game-footer">
              <span className="swipe-hint">↑ swipe up to send</span>
              {sentCount > 0 && <span className="sent-count">{sentCount} sent</span>}
            </footer>
          )}

        </div>
      )}
    </>
  );
}

export default App;
