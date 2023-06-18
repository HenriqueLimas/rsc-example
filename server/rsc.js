import React, { Fragment } from 'react'
import express from 'express'
import sanitizeFilename from 'sanitize-filename'
import { BlogPostPage } from '../pages/blog-post.js'
import { BlogIndexPage } from '../pages/blog-index.js'
import { BaseLayout } from '../pages/base-layout.js'

const app = express()

app.use(async(req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    sendJSX(
      res,
      <Router url={url} />
    )
  } catch(error) {
    console.error(error)
    res.writeHead(error.statusCode || 500)
    res.end()
  }
})

app.listen(8001)

function Router({ url }) {
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

async function sendJSX(res, jsx) {
  const clientJSX = await renderJSXToClientJSX(jsx)
  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX, 2)
  res.writeHead(200, { 'Content-type': 'application/json' })
  res.end(clientJSXString)
}

function stringifyJSX(key, value) {
  if (value === Symbol.for('react.element')) {
    return '$RE'
  }

  if (typeof value === 'string' && value.startsWith('$')) {
    return '$' + value
  }

  return value
}


async function renderJSXToClientJSX(jsx) {
  if (typeof jsx === 'string' || typeof jsx === 'number' || typeof jsx === 'boolean' || jsx == null) {
    return jsx
  }

  if (Array.isArray(jsx)) {
    return Promise.all(jsx.map(renderJSXToClientJSX))
  }

  if (typeof jsx === 'object') {
    if (jsx.$$typeof === Symbol.for("react.element")) {
      if (typeof jsx.type === 'string') {
        return {
          ...jsx,
          props: await renderJSXToClientJSX(jsx.props)
        }
      }

      if (jsx.type === Fragment) {
        return Promise.all(React.Children.map(jsx.props.children, renderJSXToClientJSX))
      }

      if (typeof jsx.type === 'function') {
        const Component = jsx.type
        const props = jsx.props
        const returnedJSX = await Component(props)
        return renderJSXToClientJSX(returnedJSX)
      }

      throw new Error('Not implemented.')
    } else {
      return Object.fromEntries(await Promise.all(
        Object.entries(jsx).map(async ([propName, value]) => [
          propName,
          await renderJSXToClientJSX(value)
        ])
      ))
    }
  } else throw new Error('Not implemented')
}
