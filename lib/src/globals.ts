import { Platform } from 'obsidian'
import data from '../package.json'
import PQueue from 'p-queue'

export const libVersion = data.version

const cpuCount = Platform.isMobileApp ? 1 : require('os').cpus().length
let backgroundProcesses = Math.max(1, Math.floor(cpuCount * 0.7))
if (backgroundProcesses == cpuCount) {
  backgroundProcesses = 1
}

console.info(
  `Text Extractor - Number of available workers: ${backgroundProcesses}`,
)

export const workerTimeout = 120_000

export const processQueue = new PQueue({ concurrency: backgroundProcesses, timeout: workerTimeout + 100 })
