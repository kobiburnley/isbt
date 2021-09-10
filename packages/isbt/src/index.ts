#!/usr/bin/env node
import minimist from 'minimist'
import { lint } from './lint'

;(async () => {
  const parsedArgs = minimist(process.argv.slice(2))

  const {
    _: [command],
  } = parsedArgs

  try {
    switch (command) {
      case 'lint':
        await (await import('./lint')).lint(parsedArgs)
        break
      case 'build':
      default:
        await (await import('./build')).build()
        break
    }
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  }
})()
