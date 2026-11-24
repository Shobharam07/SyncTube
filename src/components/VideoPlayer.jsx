import React, { useState, useEffect, useRef } from 'react';
import { youtube } from '../services/youtube.js';

export default function VideoPlayer({ state, onNotice, onDuration }) {
  const mount = useRef(null);
  const player = useRef(null);
  const latest = useRef(state);
  const loaded = useRef('');
  const revision = useRef(-1);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  latest.current = state;

  function apply(force = false) {
    const instance = player.current;
    const current = latest.current;
    if (!instance?.getCurrentTime || !current.videoId) return;

    const elapsed = current.playing ? Math.max(0, Date.now() - (current.receivedAt || Date.now())) / 1000 : 0;
    const target = current.time + elapsed;

    try {
      const changed = current.revision !== revision.current;
      revision.current = current.revision;
      if (loaded.current !== current.videoId || (changed && current.action === 'change_video')) {
        loaded.current = current.videoId;
        onDuration(0);
        const video = { videoId: current.videoId, startSeconds: target };
        if (current.playing) instance.loadVideoById(video);
        else instance.cueVideoById(video);
        return;
      }

      const duration = instance.getDuration();
      if (Number.isFinite(duration) && duration > 0) onDuration(duration);
      const position = duration > 0 ? Math.min(target, duration) : target;
      const playback = instance.getPlayerState();

      if (force || (changed && ['seek', 'pause'].includes(current.action)) || Math.abs(instance.getCurrentTime() - position) > 1.5) {
        instance.seekTo(position, true);
      }

      if (current.playing && !(duration > 0 && target >= duration)) {
        if (![1, 3].includes(playback)) instance.playVideo();
      } else if ([1, 3].includes(playback)) {
        instance.pauseVideo();
      }
    } catch {
      return;
    }
  }

  useEffect(() => {
    let active = true;
    youtube().then(YT => {
      if (!active) return;
      const element = document.createElement('div');
      mount.current.append(element);
      player.current = new YT.Player(element, {
        width: '100%',
        height: '100%',
        playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, origin: location.origin },
        events: {
          onReady: () => {
            if (active) {
              setReady(true);
              apply(true);
            }
          },
          onAutoplayBlocked: () => setBlocked(true),
          onError: () => onNotice('This video cannot be embedded. Try another YouTube video.')
        }
      });
    }).catch(error => onNotice(error.message));

    return () => {
      active = false;
      player.current?.destroy();
      player.current = null;
      loaded.current = '';
      revision.current = -1;
    };
  }, []);

  useEffect(() => {
    if (ready) apply();
  }, [state, ready]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (ready) apply();
    }, 2000);
    return () => clearInterval(timer);
  }, [ready]);

  return (
    <div className="screen">
      <div ref={mount} className="iframe" />
      {!state.videoId && (
        <div className="empty-video">
          <span className="play-logo">▶</span>
          <h2>Ready when you are.</h2>
          <p>Load a YouTube video to start watching together.</p>
        </div>
      )}
      {blocked && state.videoId && (
        <button className="unlock" onClick={() => { setBlocked(false); apply(true); }}>
          Enable synchronized playback
        </button>
      )}
    </div>
  );
}
