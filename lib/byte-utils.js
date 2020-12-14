// Use Uint8Array directly in the browser, use Buffer in Node.js but don't
// speak its name directly to avoid bundlers pulling in the `Buffer` polyfill

const useBuffer = !process.browser && global.Buffer && typeof global.Buffer.isBuffer === 'function'

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

function asU8A (buf) {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

export const toString = useBuffer
  ? (bytes) => {
      return global.Buffer.from(bytes).toString('utf8')
    }
  /* c8 ignore next 3 */
  : (bytes) => {
      return textDecoder.decode(bytes)
    }

export const fromString = useBuffer
  ? (string) => {
      return asU8A(global.Buffer.from(string))
    }
  /* c8 ignore next 3 */
  : (string) => {
      return textEncoder.encode(string)
    }

export const concat = useBuffer
  ? (chunks, length) => {
      // might get a stray plain Array here
      chunks = chunks.map((c) => c instanceof Uint8Array ? c : Buffer.from(c))
      return asU8A(global.Buffer.concat(chunks, length))
    }
  /* c8 ignore next 13 */
  : (chunks, length) => {
      const out = new Uint8Array(length)
      let off = 0
      for (let b of chunks) {
        if (off + b.length > out.length) {
          // final chunk that's bigger than we need
          b = b.subarray(0, out.length - off)
        }
        out.set(b, off)
        off += b.length
      }
      return out
    }

export const alloc = useBuffer
  ? (size) => {
      return global.Buffer.alloc(size)
    }
  /* c8 ignore next 3 */
  : (size) => {
      return new Uint8Array(size)
    }

export const toHex = useBuffer
  ? (d) => {
      if (typeof d === 'string') {
        return d
      }
      return global.Buffer.from(toBytes(d)).toString('hex')
    }
  /* c8 ignore next 6 */
  : (d) => {
      if (typeof d === 'string') {
        return d
      }
      return Array.prototype.reduce.call(toBytes(d), (p, c) => `${p}${c.toString(16).padStart(2, '0')}`, '')
    }

export const fromHex = useBuffer
  ? (hex) => {
      if (hex instanceof Uint8Array) {
        return hex
      }
      return global.Buffer.from(hex, 'hex')
    }
  /* c8 ignore next 12 */
  : (hex) => {
      if (hex instanceof Uint8Array) {
        return hex
      }
      if (!hex.length) {
        return new Uint8Array(0)
      }
      return new Uint8Array(hex.split('')
        .map((c, i, d) => i % 2 === 0 ? `0x${c}${d[i + 1]}` : '')
        .filter(Boolean)
        .map((e) => parseInt(e, 16)))
    }

function toBytes (obj) {
  if (obj instanceof Uint8Array && obj.constructor.name === 'Uint8Array') {
    return obj
  }
  if (obj instanceof ArrayBuffer) {
    return new Uint8Array(obj)
  }
  if (ArrayBuffer.isView(obj)) {
    return new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength)
  }
  /* c8 ignore next */
  throw new Error('Unknown type, must be binary type')
}