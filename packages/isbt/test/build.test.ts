import { exec } from 'child_process'
import { resolveBin } from '../src/resolveBin'
import { throwLeft } from 'fp-error'

describe('build', () => {
  it('runs command', async () => {
    const tsNodeBin = await throwLeft(() => resolveBin('ts-node'))

    const comonad = [process.execPath, tsNodeBin, 'src/index.ts', `build`].join(
      ' ',
    )

    await new Promise<void>((resolve, reject) => {
      const tscProcess = exec(
        comonad,
        {
          cwd: process.cwd(),
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
  })
})
