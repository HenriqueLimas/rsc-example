import React from 'react'
import { Footer } from '../components/footer.js'
import randomHexColor from 'random-hex-color'

export function BaseLayout({ children }) {
  const author = "Joe Doe"

  return (
    <html>
      <head>
        <title>Blog</title>
      </head>
      <body style={{ backgroundColor: randomHexColor() }}>
        <nav>
          <a href="/">Home</a>
          <hr />
          <input />
          <hr />
        </nav>
        <main>{children}</main>
        <Footer author={author} />
      </body>
    </html>
  )
}
