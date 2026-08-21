import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import ReactDOMClient from 'react-dom/client';
import pkg from '../dist/index.js';

global.IS_REACT_ACT_ENVIRONMENT = true;

const useMouseLeave = pkg.default;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setUpDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
  global.MouseEvent = dom.window.MouseEvent;
  global.Node = dom.window.Node;
}

function moveTo(target, clientX, clientY) {
  act(() => {
    const move = new MouseEvent('mousemove', { bubbles: true, clientX, clientY });
    Object.defineProperty(move, 'target', { value: target, enumerable: true });
    window.dispatchEvent(move);
  });
}

test('checkBounds treats a DOM descendant outside the geometric rect as still inside', async () => {
  setUpDom();

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOMClient.createRoot(container);

  let latestMouseLeft;
  let parentEl;
  let childEl;
  const stableChildRef = (node) => {
    childEl = node;
  };

  function Harness() {
    const [mouseLeft, setRef] = useMouseLeave();
    latestMouseLeft = mouseLeft;
    const stableParentRef = React.useCallback(
      (node) => {
        setRef(node);
        parentEl = node;
      },
      [setRef],
    );
    return React.createElement('div', { ref: stableParentRef }, React.createElement('div', { ref: stableChildRef }));
  }

  act(() => {
    root.render(React.createElement(Harness));
  });

  // A 100x100 box at the origin; the child is a plain DOM descendant
  // rendered outside it (e.g. via position: absolute), so its coordinates
  // (200, 200) fall outside the parent's own geometric rect.
  parentEl.getBoundingClientRect = () => ({ left: 0, right: 100, top: 0, bottom: 100 });

  act(() => {
    parentEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
  });
  // throttle-debounce's 50ms window: wait it out so each dispatch below
  // takes the immediate leading-edge path, instead of silently becoming a
  // queued trailing call this test can't observe synchronously.
  await sleep(60);

  // Sanity check: an unrelated target (not a descendant) outside the rect
  // must still set mouseLeft(true) -- proves the geometric fallback works.
  moveTo(document.body, 200, 200);
  assert.equal(latestMouseLeft, true, 'unrelated target outside the rect should set mouseLeft(true)');
  await sleep(60);

  // Re-enter, then the actual regression case: the target IS a contained
  // descendant (the child), still outside the rect.
  act(() => {
    parentEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
  });
  await sleep(60);
  moveTo(childEl, 200, 200);
  assert.equal(latestMouseLeft, false, 'moving onto a DOM descendant outside the rect should NOT set mouseLeft(true)');

  root.unmount();
});
