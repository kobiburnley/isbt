#!/usr/bin/env node
import minimist from 'minimist'
;(async () => {
  const parsedArgs = minimist(process.argv.slice(2))

  const {
    _: [command],
    dev,
    serve,
  } = parsedArgs

  try {
    switch (command) {
      case 'lint':
        await (await import('./lint')).lint(parsedArgs)
        break
      case 'start':
      case 'watch':
        await (await import('./start')).start()
        break
      case 'bundle':
        await (
          await import('./bundle')
        ).bundle({
          dev: Boolean(dev),
          serve: Array.isArray(serve)
            ? new Set(serve.map(String))
            : new Set([String(serve)]),
        })
        break
      case 'build':
      default:
        await (await import('./build')).build()
        break
    }
  } catch (e) {
    console.error('\nisbt exited with error:\n', e)
    process.exitCode = 1
  }
})()
