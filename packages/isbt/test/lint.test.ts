import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'

jest.useFakeTimers()
jest.setTimeout(15000)

describe('lint', () => {
  it('passes when missing files', async () => {
    await runIsbtCommandOnFixture('workspace-1', 'lint . --passWithNoTests')
  })

  it('passes when missing config', async () => {
    await runIsbtCommandOnFixture('workspace-2', 'lint . --passWithNoTests')
  })
})
