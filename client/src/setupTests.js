// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill matchMedia used across tests to avoid repeating the polyfill in each file
if (!window.matchMedia) {
	window.matchMedia = (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	});
}

// Provide a minimal TextEncoder polyfill for the Jest environment (Node's JSDOM)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class {
    encode(str) {
      return new Uint8Array(Array.from(String(str)).map(c => c.charCodeAt(0) & 0xff));
    }
  };
}
