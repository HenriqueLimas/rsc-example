import React from 'react'
import path from 'path'
import { renderToPipeableStream } from 'react-dom/server'
import { createFromNodeStream } from 'react-server-dom-webpack/client.node'
import express from 'express'
import { readFile } from 'fs/promises'
import db from './db.js'
import {renderRSCToNodeStream, Router} from './rsc.js'
import {reactClientManifest, reactSsrManifest} from './manifests.js'

const app = express()

app.use(express.urlencoded({ extended: true }))
app.get('/client.js', async(req, res) => {
  const jsFile = await readFile(path.resolve(__dirname, './client.js'), 'utf8')
  res.writeHead(200, { 'Content-Type': 'application/javascript' })
  res.end(jsFile)
})

app.get('/favicon.ico', (req, res) => {
  res.writeHead(404)
  res.end()
})

app.post('/posts/comments', async(req, res) => {
  try {
    const postId = req.body.postId

    const newComment = {
      content: req.body.comment
    }

    await db.addComment(postId, newComment)

    const postUrl = new URL(`/${postId}?jsx`, `http://${req.headers.host}`)

    await render(postUrl, res)
  } catch (error) {
    console.error(error)
    res.end(500)
  }
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
  const rscStream = renderRSCToNodeStream(<Router url={url} />, reactClientManifest)

  if (url.searchParams.has('jsx')) {
    res.set('Content-type', 'text/x-component')
    rscStream.on('data', data => {
      res.write(data)
      // res.flush()
    })
    rscStream.on('end', () => {
      res.end()
    })
  } else {
    sendHTML(
      res,
      rscStream
    )
  }
}

async function sendHTML(res, rscStream) {
  const ServerRoot = () => createFromNodeStream(rscStream, reactSsrManifest)

  const { pipe } = renderToPipeableStream(<ServerRoot />, {
    bootstrapScripts: ['/client.js'],
    onShellReady() {
      res.writeHead(200, { 'Content-type': 'text/html' })
      pipe(res)
    }
  })
}
