import './harness'

// Node 26 has a global `localStorage` of its own, undefined without `--localstorage-file`, and it
// shadows happy-dom's. The tests own both storages instead, happy-dom's class so a spec can still
// stub `Storage.prototype`.
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, {
    value: new Storage(),
    configurable: true,
    writable: true,
  })
