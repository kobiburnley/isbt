#!/usr/bin/env node
import minimist from 'minimist'
;(async () => {
  const parsedArgs = minimist(process.argv.slice(2))

  const {
    _: [command],
    root,
  } = parsedArgs

  console.log({ root })

  try {
    switch (command) {
      case 'start':
      case 'watch':
        await (
          await import('./start')
        ).start({
          root: String(root),
        })
        break
      case 'build':
      default:
        await (
          await import('./build')
        ).build({
          root: String(root),
        })
        break
    }
  } catch (e) {
    console.error('\nisbt exited with error:\n', e)
    process.exitCode = 1
  }
})()
