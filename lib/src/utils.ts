import { createHash } from '@apollo/utils.createhash'

export function makeMD5(data: string): string {
  return createHash('md5').update(data).digest('hex')
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
