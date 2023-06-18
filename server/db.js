import { randomUUID } from "crypto"
import {readFile, writeFile} from "fs/promises"

const DB_FILE = `./db/comments.json`

const db = {
  async findComments(postId) {
    const data = JSON.parse(await readFile(DB_FILE, 'utf8'))
    return data[postId] || []
  },
  async addComment(postId, comment) {
    const data = JSON.parse(await readFile(DB_FILE, 'utf8'))
    data[postId] = data[postId] || []
    comment.id = randomUUID({ disableEntropyCache: true })
    data[postId].push(comment)

    await writeFile(DB_FILE, JSON.stringify(data))
  }
}

export default db
