#!/usr/bin/env node
;(async () => {
  try {
    await (await import('./build')).build()
  } catch (e) {
    console.error('\nisbt exited with error:\n', e)
    process.exitCode = 1
  }
})()
