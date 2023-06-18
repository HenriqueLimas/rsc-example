import { renderToString } from 'react-dom/server'
import express from 'express'
import { readFile } from 'fs/promises'
import db from './db.js'

const app = express()

app.get('/client.js', async(req, res) => {
  const jsFile = await readFile('./client.js', 'utf8')
  res.writeHead(200, { 'Content-Type': 'application/javascript' })
  res.end(jsFile)
})

app.get('/favicon.ico', (req, res) => {
  res.writeHead(404)
  res.end()
})

app.post('/posts/comments', async(req, res) => {
  const postId = req.query.postId

  const newComment = {
    content: searchParams.get('comment')
  }

  await db.addComment(postId, newComment)

  const postUrl = new URL(`/${postId}?jsx`, `http://${req.headers.host}`)

  await render(postUrl, res)
})

app.get(`*`, async(req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    await render(url, res)
  } catch (error) {
    console.error(error)
    res.writeHead(500)
    res.end()
  }
})

app.listen(8000)

async function render(url, res) {
  const response = await fetch(`http://localhost:8001${url.pathname}`)
  if (!response.ok) {
    res.statusCode = response.status
    res.end()
    return
  }

  const clientJSXString = await response.text()
  if (url.searchParams.has('jsx')) {
    res.writeHead(response.status, { 'Content-type': 'application/json' })
    res.end(clientJSXString)
  } else {
    sendHTML(
      res,
      clientJSXString
    )
  }
}

function parseJSX(key, value) {
  if (value === '$RE') {
    return Symbol.for('react.element')
  }

  if (typeof value === 'string' && value.startsWith('$$')) {
    return value.slice(1)
  }

  return value
}

async function sendHTML(res, clientJSXString) {
  const clientJSX = JSON.parse(clientJSXString, parseJSX)
  let html = renderToString(clientJSX)

  html += `<script>window.__INITIAL_CLIENT_JSX_STRING__ = `
  html += JSON.stringify(clientJSXString).replace(/</g, "\\u003c")
  html += `</script>`
  html += `
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@canary",
          "react-dom/client": "https://esm.sh/react-dom@canary/client"
        }
      }
    </script>
    <script type="module" src="./client.js"></script>
  `
  res.writeHead(200, { 'Content-type': 'text/html' })
  res.end(html)
}
