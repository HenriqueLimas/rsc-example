'use client';

import React, {useState} from "react";

export function Popup() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(state => !state)}>Toggle</button>
      {isOpen && (
        <p>I am open</p>
      )}
    </>
  )
}
