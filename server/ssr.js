import React from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import stream from 'node:stream'
import { createFromNodeStream } from 'react-server-dom-webpack/client.node'
import {renderRSCToNodeStream, Router} from './rsc.js'
import {reactClientManifest, reactSsrManifest} from './manifests.js'

export async function render(url, res) {
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
  let finishStream
  const waitForRSC = new Promise(resolve => {
    finishStream = resolve
  })

  let rscTree = ''
  const rscCopy = new stream.PassThrough()

  const ServerRoot = () => {
    rscStream.pipe(rscCopy)
    return createFromNodeStream(rscStream, reactSsrManifest)
  }

  rscCopy.on('data', data => {
    rscTree += data.toString()
  })
  rscCopy.on('end', () => {
    finishStream(rscTree)
  })

  const transformStream = new stream.Transform({
    transform(chunk, encoding, callback) {
      const chunkString = chunk.toString()

      if (chunkString.includes('</body></html>')) {
        waitForRSC.then(rscTree => {
          this.push(Buffer.from(`<script>window.__addInitialRscResponseChunk__(${JSON.stringify(rscTree)})</script>`))
          callback(null, chunk)
        })
      } else {
        callback(null, chunk)
      }
    }
  })

  const rscResponseStreamBootstrapScriptContent = `(()=>{const t=new TransformStream(),w=t.writable.getWriter(),e=new TextEncoder();window.__initialRscResponseStream__=t.readable;window.__addInitialRscResponseChunk__=(text)=>w.write(e.encode(text))})()`;
  const { pipe } = renderToPipeableStream(<ServerRoot />, {
    bootstrapScripts: ['/client.js'],
    bootstrapScriptContent: rscResponseStreamBootstrapScriptContent,
    onShellReady() {
      res.writeHead(200, { 'Content-type': 'text/html' })
      transformStream.pipe(res)
      pipe(transformStream)
    }
  })
}
