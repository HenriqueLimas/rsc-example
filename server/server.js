import path from 'path'
import express from 'express'
import { readFile } from 'fs/promises'
import db from './db.js'
import {render} from './ssr.js'
import {handler} from './handler.js'

const app = express()

app.use(express.urlencoded({ extended: true }))
app.get('/*.js', async(req, res) => {
  const jsFile = await readFile(path.resolve(__dirname, `./${req.path}`), 'utf8')
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

app.get(`*`, handler);

app.listen(8000)
