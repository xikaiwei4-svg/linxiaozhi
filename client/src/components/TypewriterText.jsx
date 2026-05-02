import React, { useState, useEffect } from 'react';

function TypewriterText({ text, speed = 30 }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!text) return;
    let index = 0;
    setDisplayed('');

    const timer = setInterval(() => {
      index++;
      setDisplayed(text.substring(0, index));
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && <span className="typewriter-cursor">|</span>}
    </span>
  );
}

export default TypewriterText;
