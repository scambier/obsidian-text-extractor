import { Platform, TFile } from 'obsidian'
import { type BinaryLike, createHash } from 'crypto'
import { md5 } from 'pure-md5'
import type { ExtractedText } from './types'
import { libVersion } from './globals'

export function makeMD5(data: BinaryLike): string {
  if (Platform.isMobileApp) {
    // A node-less implementation, but since we're not hashing the same data
    // (arrayBuffer vs stringified array) the hash will be different
    return md5(data.toString())
  }
  return createHash('md5').update(data).digest('hex')
}

