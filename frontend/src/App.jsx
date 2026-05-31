import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Sparkles, Users, ArrowRight, Compass, ArrowLeft } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5001';

function App() {
  const [step, setStep] = useState('home'); // 'home' | 'create' | 'join' | 'waiting' | 'game'
  const [pin, setPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [partnerConnected, setPartnerConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Cleanup socket on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initSocket = (roomPin) => {
    socketRef.current = io(BACKEND_URL);
    
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      socketRef.current.emit('join-room', roomPin);
    });

    socketRef.current.on('partner-joined', (data) => {
      console.log('Partner joined:', data.message);
      setPartnerConnected(true);
      setStep('game');
    });

    socketRef.current.on('receive-meme', (data) => {
      console.log('Received meme:', data);
      // Gameplay logic will be handled here in the next phase
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  };

  const handleCreateRoom = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/create-room`);
      const data = await response.json();
      if (data.roomPin) {
        setPin(data.roomPin);
        setStep('waiting');
        initSocket(data.roomPin);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Cannot connect to backend server. Make sure it is running on ' + BACKEND_URL);
    }
  };

  const handleJoinRoomSubmit = (e) => {
    e.preventDefault();
    if (inputPin.length !== 5) {
      alert('Please enter a valid 5-digit PIN');
      return;
    }
    setPin(inputPin);
    initSocket(inputPin);
    setStep('waiting');
  };

  return (
    <div className="glass-card">
      {step === 'home' && (
        <div>
          <div className="title-gradient">Geser Geser</div>
          <p className="subtitle">Swipe memes in real-time with your partner!</p>
          
          <button className="btn btn-primary" onClick={handleCreateRoom}>
            <Sparkles size={18} />
            Create Room
          </button>
          
          <button className="btn btn-secondary" onClick={() => setStep('join')}>
            <Users size={18} />
            Join Room
          </button>
        </div>
      )}

      {step === 'join' && (
        <form onSubmit={handleJoinRoomSubmit}>
          <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem', marginBottom: '1rem' }} onClick={() => setStep('home')}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="title-gradient" style={{ fontSize: '2rem' }}>Enter Room PIN</div>
          <p className="subtitle">Ask your partner for their 5-digit code</p>
          
          <input 
            type="text" 
            className="input-pin" 
            placeholder="00000" 
            maxLength={5}
            value={inputPin}
            onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
          />
          
          <button type="submit" className="btn btn-primary">
            Join Room
            <ArrowRight size={18} />
          </button>
        </form>
      )}

      {step === 'waiting' && (
        <div>
          <div className="title-gradient" style={{ fontSize: '2rem' }}>Room Ready</div>
          <p className="subtitle">Share this code with your partner to start sliding</p>
          
          <div className="pin-display">{pin}</div>
          
          <div className="waiting-spinner"></div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Waiting for partner to join...</p>
        </div>
      )}

      {step === 'game' && (
        <div>
          <div className="title-gradient" style={{ fontSize: '2rem' }}>Connected!</div>
          <p className="subtitle">You are now in Room: <strong>{pin}</strong></p>
          <div style={{ margin: '2rem 0', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Compass size={24} className="animate-spin" />
            <span>Ready for swiping gameplay!</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Next phase: Implement swipe animations and real-time meme exchanges.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
