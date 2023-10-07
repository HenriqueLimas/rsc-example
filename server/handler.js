import {render} from "./ssr.js"

export async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    await render(url, res)
  } catch (error) {
    console.error(error)
    res.writeHead(500)
    res.end()
  }
}
