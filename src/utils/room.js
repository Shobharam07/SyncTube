export const initial = { videoId: '', playing: false, time: 0, updatedAt: 0, revision: 0 };

export function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem('synctube-session'));
    return session?.roomId && session?.userId && session?.token ? session : null;
  } catch {
    return null;
  }
}

export function extractId(input) {
  const raw = input.trim();
  if (/^[\w-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') {
      id = url.pathname.split('/')[1];
    } else if (['youtube.com', 'm.youtube.com'].includes(host)) {
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch {
    return null;
  }
}

export function format(seconds) {
  const time = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
}
