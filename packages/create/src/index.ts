#!/usr/bin/env node

import { create } from './create'
import { throwLeft } from 'fp-error'
;(async () => {
  try {
    await throwLeft(() => create(process.env.INIT_CWD ?? process.cwd()))
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  }
})()
