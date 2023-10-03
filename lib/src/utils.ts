import { type BinaryLike } from 'crypto'
import { md5 } from 'pure-md5'

export function makeMD5(data: BinaryLike): string {
  return md5(data.toString())
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
