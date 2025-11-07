import React, { useEffect, useRef, useState } from 'react';

interface SeamlessVideoBackgroundProps {
  src: string;
  poster?: string;
  crossfadeSeconds?: number; // default 0.6s
  brightness?: number; // 1 = normal, >1 brighter
}

// Crossfading two muted inline <video> tags to minimize loop stutter.
const SeamlessVideoBackground: React.FC<SeamlessVideoBackgroundProps> = ({
  src,
  poster,
  crossfadeSeconds = 0.6,
  brightness = 1,
}) => {
  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);
  const [activeIsA, setActiveIsA] = useState(true);
  const [aReady, setAReady] = useState(false);
  const [bReady, setBReady] = useState(false);
  const switchingRef = useRef(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const a = aRef.current!;
    const b = bRef.current!;
    if (!a || !b) return;

    const onLoadedA = () => setAReady(true);
    const onLoadedB = () => setBReady(true);
    a.addEventListener('loadedmetadata', onLoadedA);
    b.addEventListener('loadedmetadata', onLoadedB);

    // autoplay A once ready
    const maybeStart = () => {
      if (aReady && !a.paused) return;
      if (aReady) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
    };
    const id = setInterval(maybeStart, 100);

    const monitor = () => {
      const vid = activeIsA ? a : b;
      const other = activeIsA ? b : a;
      if (!vid || !other || !vid.duration || switchingRef.current) return;
      if (vid.currentTime >= vid.duration - crossfadeSeconds - 0.05) {
        switchingRef.current = true;
        other.currentTime = 0;
        other.play().catch(() => {});
        // start fade by toggling class
        other.style.opacity = '1';
        setTimeout(() => {
          vid.pause();
          vid.style.opacity = '0';
          setActiveIsA(!activeIsA);
          switchingRef.current = false;
        }, crossfadeSeconds * 1000);
      }
    };

    const intervalId = setInterval(monitor, 60);

    return () => {
      clearInterval(intervalId);
      clearInterval(id);
      a.removeEventListener('loadedmetadata', onLoadedA);
      b.removeEventListener('loadedmetadata', onLoadedB);
    };
  }, [aReady, bReady, activeIsA, crossfadeSeconds]);

  return (
    <div className="absolute inset-0">
      {hasError && poster ? (
        <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
      <video
        ref={aRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        src={src}
        autoPlay
        muted
        loop={false}
        playsInline
        preload="auto"
        poster={poster}
        onError={() => setHasError(true)}
        style={{ opacity: 1, filter: `brightness(${brightness})` }}
      />
      <video
        ref={bRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        src={src}
        autoPlay={false}
        muted
        loop={false}
        playsInline
        preload="auto"
        poster={poster}
        onError={() => setHasError(true)}
        style={{ opacity: 0, filter: `brightness(${brightness})` }}
      />
    </div>
  );
};

export default SeamlessVideoBackground;

