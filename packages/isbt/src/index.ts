#!/usr/bin/env node
import minimist from 'minimist'

;(async () => {
  const {
    _: [command],
  } = minimist(process.argv.slice(2))

  try {
    switch (command) {
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
