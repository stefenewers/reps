/* Reps Python worker (a module worker: Pyodide 314 no longer supports classic workers).
 *
 * Runs Pyodide off the main thread so an infinite loop never freezes the page:
 * the main thread terminates this worker on timeout and starts a fresh one.
 * Messages:
 *   { id, type: 'init', indexURL }        → { id, type: 'ready' } | { id, type: 'error', error }
 *   { id, type: 'run', code, tests }      → { id, type: 'result', result }   | { id, type: 'error', error }
 */

let pyodide = null
let loading = null

function load(indexURL) {
  if (!loading) {
    loading = (async () => {
      const { loadPyodide } = await import(indexURL + 'pyodide.mjs')
      pyodide = await loadPyodide({ indexURL })
      const res = await fetch('/python/harness.py')
      if (!res.ok) throw new Error('could not load the test harness')
      pyodide.runPython(await res.text())
    })()
  }
  return loading
}

self.onmessage = async (event) => {
  const { id, type } = event.data
  try {
    if (type === 'init') {
      await load(event.data.indexURL)
      self.postMessage({ id, type: 'ready' })
      return
    }
    if (type === 'run') {
      if (!pyodide) throw new Error('Python is not loaded yet')
      const main = pyodide.globals.get('__reps_main')
      try {
        const out = main(event.data.code, JSON.stringify(event.data.tests || []))
        self.postMessage({ id, type: 'result', result: JSON.parse(out) })
      } finally {
        main.destroy()
      }
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', error: String((err && err.message) || err) })
  }
}
