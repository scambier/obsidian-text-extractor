import { type BinaryLike } from 'crypto'
import { md5 } from 'pure-md5'

export const makeMD5 = (data: BinaryLike) => typeof data === "string"
  ? md5(data)
  : md5(new TextDecoder().decode(data))

export const slugify = (str: string) => str
  .toLowerCase()
  // https://dev.to/tillsanders/let-s-stop-using-a-za-z-4a0m */
  .replace(/[^\p{Letter}\p{Mark}0-9]/gu, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
