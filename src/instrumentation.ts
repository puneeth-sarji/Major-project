export async function register() {
  // Polyfill localStorage for server-side rendering.
  // Node.js 25+ exposes a Proxy-based localStorage that doesn't have
  // the standard methods, which causes a crash during SSR.
  if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      },
    });
  }
}
