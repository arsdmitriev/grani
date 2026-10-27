// No 0/O, 1/l/I: a password is dictated and copied by hand. Symbols safe in a shell and a URL.
const ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZ' + 'abcdefghijkmnpqrstuvwxyz' + '23456789' + '!@#$%^&*-_=+'

// The four kinds a password policy asks for; a generated password holds each one.
const KINDS = [/[A-Z]/, /[a-z]/, /[2-9]/, /[^A-Za-z0-9]/]

function draw(size: number): string {
  const max = 256 - (256 % ALPHABET.length)
  const out: string[] = []
  while (out.length < size) {
    const buf = new Uint8Array(size * 2)
    crypto.getRandomValues(buf)
    for (const byte of buf) {
      if (byte >= max) continue
      out.push(ALPHABET[byte % ALPHABET.length]!)
      if (out.length === size) break
    }
  }
  return out.join('')
}

/**
 * A random password from `crypto.getRandomValues`, uniform over the alphabet (bytes above its
 * largest multiple are discarded, not reduced), between 10 and 256 characters, 16 when the length
 * is not a number. It holds a lower, an upper, a digit and a symbol: a draw without one is drawn
 * again, so the passwords stay uniform over the ones a policy accepts.
 */
export function generatePassword(length = 16): string {
  const size = Number.isFinite(length) ? Math.min(256, Math.max(10, Math.floor(length))) : 16
  for (;;) {
    const password = draw(size)
    if (KINDS.every((kind) => kind.test(password))) return password
  }
}
