import { useState } from 'react';
import useMouseLeave from '../src/index';

export default function App() {
  const [mouseLeft, setRef] = useMouseLeave<HTMLDivElement>();
  const [nativeLeft, setNativeLeft] = useState(true);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 640, margin: '80px auto', padding: '0 20px' }}>
      <h1>useMouseLeave demo</h1>
      <p>
        The blue box is the tracked element. The red box is its child, positioned <code>absolute</code> so that part of
        it sticks out past the blue box&apos;s own edge. Move the pointer onto the overflowing part of the red box: both
        readouts below should stay &quot;not left&quot;, since the red box is still a DOM descendant of the blue one --
        even though it&apos;s rendered outside the blue box&apos;s own geometric bounds.
      </p>

      <div
        ref={setRef}
        onMouseEnter={() => setNativeLeft(false)}
        onMouseLeave={() => setNativeLeft(true)}
        style={{
          position: 'relative',
          width: 200,
          height: 120,
          margin: '40px 120px 40px 40px',
          background: mouseLeft ? '#3b82f6' : '#1d4ed8',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -60,
            bottom: -30,
            width: 100,
            height: 80,
            background: '#ef4444',
          }}
        />
      </div>

      <p>
        <strong>useMouseLeave:</strong> mouseLeft = <code>{String(mouseLeft)}</code>
      </p>
      <p>
        <strong>Native onMouseEnter/onMouseLeave</strong> on the blue box: left = <code>{String(nativeLeft)}</code>
      </p>
    </div>
  );
}
