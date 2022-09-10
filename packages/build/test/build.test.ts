import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'
import { exec } from 'child_process'
import path from 'path'
import { promises as fs } from 'fs'

jest.setTimeout(15000)

describe('build', () => {
  it('runs command on bundle-browser', async () => {
    await runIsbtCommandOnFixture('bundle-browser', 'build')
  })

  it('runs command on specific-root', async () => {
    const cwd = path.join(process.cwd(), 'test', 'fixtures', 'specific-root')

    await new Promise<void>((resolve, reject) => {
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

    expect(
      (await fs.stat(path.join(cwd, 'packages', 'a', 'dist'))).isDirectory(),
    ).toBe(true)
    expect(
      (await fs.stat(path.join(cwd, 'packages', 'b', 'dist'))).isDirectory(),
    ).toBe(true)
    expect(
      (await fs.stat(path.join(cwd, 'packages', 'c', 'dist'))).isDirectory(),
    ).toBe(true)
    expect(
      (
        await fs.stat(path.join(cwd, 'packages', 'd', 'dist')).catch(() => null)
      )?.isDirectory() ?? false,
    ).toBe(false)
  })
})
