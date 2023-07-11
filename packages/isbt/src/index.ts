#!/usr/bin/env node
import minimist from 'minimist'
import { defaultCustomization } from './defaultCustomization'
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
        await (
          await import('@isbt/build')
        ).start({
          customization: defaultCustomization,
          dev: Boolean(dev),
        })
        break
      case 'bundle':
        await (
          await import('./bundle')
        ).bundle({
          dev: Boolean(dev),
          serve: new Set(
            (Array.isArray(serve) ? serve : [serve])
              .filter(Boolean)
              .map(String),
          ),
        })
        break
      case 'build':
      default:
        await (
          await import('@isbt/build')
        ).build({
          customization: defaultCustomization,
          dev: Boolean(dev),
        })
        break
    }
  } catch (e) {
    console.error('\nisbt exited with error:\n', e)
    process.exitCode = 1
  }
})()
