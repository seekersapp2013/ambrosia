// Basic service worker registration + install prompt relay
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(console.warn);
  });
}

window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  // Notify React that prompt is available
  window.dispatchEvent(new CustomEvent('pwaPromptAvailable'));
});