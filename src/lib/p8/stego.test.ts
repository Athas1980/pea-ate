import { describe, it, expect } from 'vitest'
import { decodeCode } from './stego'

const CODE_START = 0x4300

// Compressed-code fixtures, produced by shrinko8 (force_compress) and verified
// to round-trip byte-for-byte against its reference decoder. The sample is
// crafted so the PXA blob exercises every branch of the decoder: move-to-front
// literals, back-references (incl. the 3-bit count-continuation chunk), and the
// raw literal run (a block of incompressible high bytes). Additionally verified
// against a real 49,644-char cart (scrapboy by BoneVolt) during development.

// decoded text the two compressed fixtures should yield (latin1, base64-wrapped
// to safely carry the incompressible high bytes through source).
const SAMPLE_B64 =
  'ZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKZnVuY3Rpb24gdGljaygpIHkgLT0gMSBlbmQKU/MnZqcNE9OKGV6WD+mCNwoXcGwSPhiObRDUkSDzOqKhlvMQlJZmDfo5DI/cI0tsJYsfk0+Q0a8vG5WTpDFgGY23EZEQnzWAr4lux1F4lu11XU1AzC+zyD8VlE2Hf+FYu3NKnPsTH4RsK8JYJ+9+bAv3rBTEj5PLCmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYgo='

const PXA_B64 =
  'AHB4YQHiALhnv8L9Z7/C8S8Q7UZRdf8BF2QvUZxxVnJLcX18/Zb1////////////////LwEwNX9idtowMa2Y4WX5kC54o3ABxybhg+HYBkEdCTKvIxpqOQ9BaWnWoJ/D8Mg9ssRWsvgx+QQZ/fqyUTlJGgOW0XgbEQnxWQP4muh2HIVn2V7X1QTE/DKL/FNB2XT4F461O6fEuT/xQci2Iox18u7HtnDPSkH8OLmsIAZg8P////8KAA=='

const OLD_B64 =
  'OmM6AAHiAAASIRoPIBUbGgIgFQ8XKisCJQIALTMCBAIRGhABPfs9+z37Pfs9+z37Pfs9+z37Pfs9+z37Pfs9+z07AFMA8wAnEgCnAA0AEwDTAIoAGQBeAJYADwDpAIIKAQAXHBgAEjEAGACOGQAQANQAkQIA8zYAogChAJYA8wAQAJQAlhIADQD6DAAMAI8A3CgASxgpAIsAHwCTAE8AkADRAK80ABsAlQCTAKQEAGAAGQCNALcAEQCRABAAnwgAgACvAIkaAMcAUSQAlgDtIS8ATQBAAMw0ALMAyAA/ABUAlABNAIcAfwDhAFgAux8ASgCcAPsAEwAfAIQYMgDCAFgAJwDvOhgACwD3AKwAFADEAI8AkwDLAQ4ODjwTPEY8rD3xPfE98TzfAQ=='

function bytesFromB64(b64: string): Uint8Array {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr
}

// decodeCode indexes from 0x4300; place a compressed-code blob there in an
// otherwise-zeroed cart buffer, mirroring how it sits in a real cart binary.
function cartWithCode(region: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(0x8000)
  bytes.set(region, CODE_START)
  return bytes
}

describe('decodeCode', () => {
  const sample = atob(SAMPLE_B64) // latin1 -- char code == byte

  it('decodes the new PXA format (mtf, back-refs, raw runs)', () => {
    const region = bytesFromB64(PXA_B64)
    expect([...region.slice(0, 4)]).toEqual([0x00, 0x70, 0x78, 0x61]) // \0pxa
    expect(decodeCode(cartWithCode(region))).toBe(sample)
  })

  it('decodes the legacy :c: format', () => {
    const region = bytesFromB64(OLD_B64)
    expect([...region.slice(0, 4)]).toEqual([0x3a, 0x63, 0x3a, 0x00]) // :c:\0
    expect(decodeCode(cartWithCode(region))).toBe(sample)
  })

  it('reads uncompressed null-terminated code', () => {
    const code = 'function _init() x=1 end\n'
    const region = new Uint8Array(code.length + 1) // trailing null terminator
    for (let i = 0; i < code.length; i++) region[i] = code.charCodeAt(i)
    expect(decodeCode(cartWithCode(region))).toBe(code)
  })

  it('returns empty string for an empty code region', () => {
    expect(decodeCode(new Uint8Array(0x8000))).toBe('')
  })
})
