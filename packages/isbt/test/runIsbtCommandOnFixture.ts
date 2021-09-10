import path from 'path'
import { throwLeft } from 'fp-error'
import { resolveBin } from '../src/resolveBin'
import { exec } from 'child_process'

export async function runIsbtCommandOnFixture(
  fixture: string,
  command: string,
) {
  const cwd = path.join(process.cwd(), 'test', 'fixtures', fixture)

  const tsNodeBin = await throwLeft(() => resolveBin('ts-node', { cwd }))

  const isbtBin = path.relative(
    cwd,
    path.join(process.cwd(), 'src', 'index.ts'),
  )

  const comonad = [process.execPath, tsNodeBin, '-T', isbtBin, command].join(
    ' ',
  )

  await new Promise<void>((resolve, reject) => {
    const tscProcess = exec(
      comonad,
      {
        cwd,
      },
      (error) => {
        if (error) {
          reject(new Error(error.message))
        } else {
          resolve()
        }
      },
    )

    tscProcess.stdout?.pipe(process.stdout)
  })
}
