import stream from 'node:stream'
import { renderToPipeableStream } from 'react-server-dom-webpack/server.node'
import React from 'react'
import sanitizeFilename from 'sanitize-filename'
import { BlogPostPage } from '../pages/blog-post.js'
import { BlogIndexPage } from '../pages/blog-index.js'
import { BaseLayout } from '../pages/base-layout.js'

export function Router({ url }) {
  let page
  if (url.pathname === "/") {
    page = <BlogIndexPage />
  } else if (!url.pathname.includes('.')) {
    const postSlug = sanitizeFilename(url.pathname.slice(1))
    page = <BlogPostPage postSlug={postSlug} />
  } else {
    const notFound = new Error(`Not found ${url.pathname}`)
    notFound.statusCode = 404
    throw notFound
  }

  return <BaseLayout>{page}</BaseLayout>
}

export function renderRSCToNodeStream(app, moduleMap) {
  const passThroughStream = new stream.PassThrough()

  const { pipe } = renderToPipeableStream(app, moduleMap)
  pipe(passThroughStream)
  return passThroughStream
}
