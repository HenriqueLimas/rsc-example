import React, {startTransition, use, useState} from "react"
import { hydrateRoot } from 'react-dom/client'
import { createFromFetch, createFromReadableStream } from 'react-server-dom-webpack/client.browser'

let updateRoot
let currentPathname = window.location.pathname
const initialData = createFromReadableStream(window.__initialRscResponseStream__)

function Shell({ data }) {
  const [root, setRoot] = useState(use(data))
  updateRoot = setRoot
  return root
}

hydrateRoot(document, <Shell data={initialData} />)

const cache = {
  [currentPathname]: initialData
}

async function navigate(pathname) {
  currentPathname = pathname

  const root = await createFromFetch(fetch(pathname + '?jsx'))
  cache[pathname] = root

  if (currentPathname === pathname) {
    startTransition(() => {
      updateRoot(root)
    })
  }
}

window.addEventListener('click', (event) => {
  if (event.target.tagName !== 'A') {
    return
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  const href = event.target.getAttribute('href')
  if (!href.startsWith('/')) {
    return
  }

  event.preventDefault()
  window.history.pushState(null, null, href)
  navigate(href)
}, true)

window.addEventListener('popstate', () => {
  if (cache[window.location.pathname]) {
    startTransition(() => {
      updateRoot(cache[window.location.pathname])
    })
  } else {
    navigate(window.location.pathname)
  }
})

window.addEventListener('submit', async(event) => {
  event.preventDefault()

  const pathname = event.target.getAttribute('action')
  const formData = new FormData(event.target)
  const root = await createFromFetch(fetch(pathname, {
    headers: {
      Accept: 'text/x-component'
    },
    body: new URLSearchParams(formData),
    method: 'POST'
  }))
  startTransition(() => {
    updateRoot(root)
  })
})
