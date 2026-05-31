import React, { useState, useRef, useEffect, useCallback } from 'react';

const SWIPE_THRESHOLD    = 80;   // px upward to commit
const VELOCITY_THRESHOLD = 0.45; // px/ms
const LAND_DURATION      = 580;  // ms — drop-in animation

export default function MemeCard({
  meme,
  onSwipeUp,           // called when card is sent off the top
  incoming = false,    // true = card drops in from the top
}) {
  const [offset,    setOffset]    = useState({ x: 0, y: 0 });
  const [flownOff,  setFlownOff]  = useState(false);
  const [snapping,  setSnapping]  = useState(false);
  const [isLanding, setIsLanding] = useState(incoming);

  const cardRef  = useRef(null);
  const dragData = useRef(null); // { startX, startY, startTime }

  // Lift drag lock once landing animation finishes
  useEffect(() => {
    if (!incoming) return;
    const t = setTimeout(() => setIsLanding(false), LAND_DURATION);
    return () => clearTimeout(t);
  }, [incoming]);

  // ── Pointer handlers ────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (flownOff || isLanding) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragData.current = { startX: e.clientX, startY: e.clientY, startTime: Date.now() };
    setSnapping(false);
  }, [flownOff, isLanding]);

  const onPointerMove = useCallback((e) => {
    if (!dragData.current || flownOff) return;
    e.preventDefault();
    const dy = e.clientY - dragData.current.startY; // negative = upward
    const dx = e.clientX - dragData.current.startX;
    // Primary axis is Y; allow slight horizontal drift for naturalness
    setOffset({ x: dx * 0.12, y: Math.min(dy, 40) }); // clamp downward pull
  }, [flownOff]);

  const onPointerUp = useCallback((e) => {
    if (!dragData.current || flownOff) return;
    const dy  = e.clientY - dragData.current.startY; // negative = up
    const dt  = Math.max(1, Date.now() - dragData.current.startTime);
    const vel = Math.abs(dy) / dt;
    dragData.current = null;

    const movedUp = -dy > SWIPE_THRESHOLD || (dy < 0 && vel > VELOCITY_THRESHOLD);

    if (movedUp) {
      setFlownOff(true);
      setOffset({ x: 0, y: -window.innerHeight * 1.4 });
      setTimeout(() => onSwipeUp?.(), 380);
    } else {
      setSnapping(true);
      setOffset({ x: 0, y: 0 });
      setTimeout(() => setSnapping(false), 420);
    }
  }, [flownOff, onSwipeUp]);

  // ── Style ────────────────────────────────────────────────────
  // Tilt card slightly based on horizontal drift while dragging
  const rotation = offset.x * 0.06;

  const getTransition = () => {
    if (isLanding)        return 'none'; // CSS keyframe owns transform
    if (dragData.current) return 'none';
    if (flownOff)         return 'transform 0.38s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.38s ease';
    if (snapping)         return 'transform 0.44s cubic-bezier(0.34, 1.56, 0.64, 1)';
    return 'transform 0.22s ease';
  };

  const cardStyle = isLanding
    ? {} // CSS @keyframes controls position during drop
    : {
        transform:  `translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg)`,
        transition: getTransition(),
        opacity:    flownOff ? 0 : 1,
        cursor:     dragData.current ? 'grabbing' : 'grab',
      };

  // Show "SEND" badge as user drags upward
  const sendOpacity = Math.min(1, Math.max(0, -offset.y / SWIPE_THRESHOLD));

  return (
    <div
      ref={cardRef}
      className={`meme-card${incoming && isLanding ? ' meme-card--incoming' : ''}`}
      style={cardStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={meme.url} alt={meme.alt} draggable={false} />
      <div className="meme-card__overlay" />

      {/* Send badge — appears as user swipes up */}
      <div className="swipe-indicator swipe-indicator--up" style={{ opacity: sendOpacity }}>
        ↑ SEND
      </div>
    </div>
  );
}
