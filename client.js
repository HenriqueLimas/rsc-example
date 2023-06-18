import { hydrateRoot } from 'react-dom/client'

const initialClientJsx = getInitialClientJsx()
const root = hydrateRoot(document, initialClientJsx)
function getInitialClientJsx() {
  const clientJsx = JSON.parse(window.__INITIAL_CLIENT_JSX_STRING__, parseJSX)
  return clientJsx
}

let currentPathname = window.location.pathname

const cache = {
  [currentPathname]: initialClientJsx
}

async function navigate(pathname) {
  currentPathname = pathname

  const response = await fetch(pathname + '?jsx')
  const jsonString = JSON.parse(await response.text(), parseJSX)
  cache[pathname] = jsonString

  if (currentPathname === pathname) {
    root.render(jsonString)
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
    root.render(cache[window.location.pathname])
  } else {
    navigate(window.location.pathname)
  }
})

window.addEventListener('submit', async(event) => {
  event.preventDefault()

  const pathname = event.target.getAttribute('action')
  const formData = new FormData(event.target)
  const response = await fetch(pathname, {
    body: new URLSearchParams(formData),
    method: 'POST'
  })
  const jsonString = JSON.parse(await response.text(), parseJSX)
  cache[currentPathname] = jsonString
  root.render(jsonString)
})
