# useMouseLeave

_React hook to reliably run an effect on `mouseleave`_

## But why?

`mouseleave` is about [as](https://stackoverflow.com/questions/31775182/react-event-onmouseleave-not-triggered-when-moving-cursor-fast) [reliable](https://stackoverflow.com/questions/29981236/how-do-you-hover-in-reactjs-onmouseleave-not-registered-during-fast-hover-ove) [as](https://stackoverflow.com/questions/7448468/why-cant-i-reliably-capture-a-mouseout-event) [rain](https://github.com/facebook/react/issues/4251) [in](https://bugs.chromium.org/p/chromium/issues/detail?id=276329) [the](https://github.com/facebook/react/issues/4492) [Sahara](https://bugs.chromium.org/p/chromium/issues/detail?id=515921).

A guy even went so far as using [jQuery _inside_ React](https://www.man42.net/blog/2016/08/react-onmouseleave-workaround/) to have a resemblance of predictability. Imagine that.

Introducing, **useMouseLeave**.

_useMouseLeave_ is the easiest way to fire effects reliably when the mouse leaves (`mouseleave` is the name of the native event) an element. Also similar to `mouseout`, but there probably isn't a need for a _useMouseOut_ hook.

## How to use it

### Installation

```
npm install use-mouse-leave --save
~ or ~
yarn add use-mouse-leave
```

### Usage

At the top of your file:

```js
import useMouseLeave from 'use-mouse-leave';
```

Then in your component function:

```js
[...]

const [mouseLeft, ref] = useMouseLeave();

useEffect(() => {
  if (mouseLeft) {
    // The mouse has just left our element, time to
    // run whatever it was we wanted to run on mouseleave:
    // ...
  }
}, [mouseLeft]);

[...]

return (
  <div ref={ref}>
    ...
  </div>
);
```

### Accessing the inner ref

For some reasons, you might want to access the inner ref.

For example, let's imagine you have a calendar and want to show a popup with more informations when hovering an event.

```
<EventPopupWrapper target={the event being hovered}>
  <Calendar>
    ...dozens of nested components
         <Event />
  </Calendar>
</PopupWrapper>
```

You would need to be able to get the event's dom node, to attach the Popup to it.

`useMouseLeave` exposes its internal ref for you to play with as the third parameter of the returned tuple.

```js
[...]

const [
  mouseLeft,
  setRef, // the callback ref to put on the div
  innerRef, // the internal ref that directly points on the dom node
] = useMouseLeave();

useEffect(() => {
  if (mouseLeft) { ... }
}, [mouseLeft]);

[...]

return (
  <div
    ref={setRef}
    onMouseEnter={() => {
      // innerRef.current => <div ....>
      // you can now use innerRef.current to anchor the popup to this div
    }}
  >
    ...
  </div>
);
```
> 

### Demo

[![Edit determined-goldwasser-35ukt](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/determined-goldwasser-35ukt?fontsize=14&module=%2Fsrc%2FApp.tsx)

## How it works

The hook attaches a `mouseenter` listener (which is reliable) to our element. This listener in turn attaches a `mousemove` listener to the **window** object (throttled to 50ms for extra bonus sparkly performance ✨🦄), and constantly checks whether the pointer is still within the element's box or not. Then removes the window listener when `mouseleave` is detected, to save resources. That's it.

_Please note_

The hook uses `getClientBoundingRect()` to determine the boundaries of the element. This means that if the element has children positioned _relatively_, _absolutely_ or _fixedly_ they will not be taken into account (as they do not influence the element's box). Same goes with children with applied transforms.

On the other hand, the browser takes those children into account. Play around with the demo to see when we fire `mouseleave` and when the browser does.

## Tests

One day I'll write fancy Cypress tests (probably something [like this](https://stackoverflow.com/questions/55361499/how-to-implement-drag-and-drop-in-cypress-test)), for the moment just know that I've personally, tirelessly and manually stress-tested it using the above sandbox on Chrome, Firefox, Safari and Edge. Do test it in your own project though: mouse events are weird.

## Credits

Heavily inspired by @mrdanimal's [implementation](https://github.com/facebook/react/issues/6807#issuecomment-446021227) using lifecycle methods.
