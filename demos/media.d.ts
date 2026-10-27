// A picture a demo imports is its URL, as Vite gives it.
declare module '*.webp' {
  const src: string
  export default src
}
