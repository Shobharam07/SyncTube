let apiPromise;

export function youtube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => {
        apiPromise = undefined;
        script.remove();
        reject(Error('YouTube API unavailable'));
      };
      document.head.append(script);
    });
  }
  return apiPromise;
}
