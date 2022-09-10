import path from 'path'
import { throwLeft } from 'fp-error'
import { resolveBin } from '../src/resolveBin'
import { exec } from 'child_process'
import { EventEmitter } from 'events'

export async function runIsbtCommandOnFixture(
  fixture: string,
  command: string,
  {
    stdout = process.stdout,
    events,
    flags = [],
  }: {
    stdout?: NodeJS.WritableStream
    events?: EventEmitter
    flags?: string[]
  } = {},
) {
  const cwd = path.join(process.cwd(), 'test', 'fixtures', fixture)

  const tsNodeBin = await throwLeft(() => resolveBin('ts-node', { cwd }))

  const isbtBin = path.relative(cwd, path.join(process.cwd(), 'src', 'bin.ts'))

  const comonad = [process.execPath, tsNodeBin, '-T', isbtBin, command].join(
    ' ',
  )

  await new Promise<void>((resolve, reject) => {
    const childProcess = exec(
      [comonad, ...flags].join(' '),
      {
        cwd,
      },
      (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      },
    )

    childProcess.stdout?.pipe(stdout)

    events?.once('kill', () => {
      childProcess?.kill()
    })
  })
}
