import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'
import { exec } from 'child_process'
import path from 'path'

jest.setTimeout(15000)

describe('build', () => {
  it('runs command on bundle-browser', async () => {
    await runIsbtCommandOnFixture('bundle-browser', 'build')
  })

  it('runs command on specific-root', async () => {
    await new Promise<void>((resolve, reject) => {
      const cwd = path.join(process.cwd(), 'test', 'fixtures', 'specific-root')
      const childProcess = exec(
        'yarn install',
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

      childProcess.stdout?.pipe(process.stdout)
    })

    await runIsbtCommandOnFixture('specific-root', 'build', {
      flags: ['--root', 'a'],
    })
  })
})
