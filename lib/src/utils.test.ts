import { describe, expect, test } from 'vitest'
import { makeMD5, slugify } from './utils'
import { md5 } from 'pure-md5'

describe('makeMD5', () => {
  const text: string = 'Café coffee'
  const expectedHash = md5(text)

  test('computes the MD5 hash of a string', () => {
    expect(makeMD5(text)).toBe(expectedHash)
  })

  test('computes the MD5 hash of a Buffer', () => {
    const data: Buffer = Buffer.from(text)
    expect(makeMD5(data)).toBe(expectedHash)
  })

  test('computes the MD5 hash of a Uint8Array', () => {
    const data: Uint8Array = new Uint8Array(Buffer.from(text))
    expect(makeMD5(data)).toBe(expectedHash)
  })

  test('computes the MD5 hash of an Int32Array', () => {
    const data: Int32Array = new Int32Array([1, 2, 3, 4])
    const expectedHash = md5(Buffer.from(data.buffer).toString())
    expect(makeMD5(data)).toBe(expectedHash)
  })

  test('computes the MD5 hash of an empty string', () => {
    const data: string = ''
    const expectedHash = md5(data)
    expect(makeMD5(data)).toBe(expectedHash)
  })

  test('computes the MD5 hash of an empty buffer', () => {
    const data: Buffer = Buffer.from('')
    const expectedHash = md5(data.toString())
    expect(makeMD5(data)).toBe(expectedHash)
  })
})

describe('slugify', () => {
  test('converts a string to lowercase', () =>
    expect(slugify('HelloWorld')).toBe('helloworld'))

  test('replaces spaces and non-alphanumeric characters with hyphens', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
    expect(slugify('This is a test.')).toBe('this-is-a-test')
    expect(slugify('Café')).toBe('café')
  })

  test('replaces multiple hyphens with a single hyphen', () =>
    expect(slugify('Hello---World')).toBe('hello-world'))

  test('removes leading and trailing hyphens', () =>
    expect(slugify('-Hello-World-')).toBe('hello-world'))

  test('handles empty string', () => expect(slugify('')).toBe(''))

  test('handles strings with only special characters', () =>
    expect(slugify('!@#$%^&*()')).toBe(''))

  test('handles strings with numeric characters', () => {
    expect(slugify('12345')).toBe('12345')
    expect(slugify('Test123')).toBe('test123')
  })
})
