import { ParsedArgs } from 'minimist'
import { exec } from 'child_process'
import { throwLeft, tryCatchAsync } from 'fp-error'
import { resolveBin } from './resolveBin'
import { isLeft } from 'fp-ts/Either'

export async function lint(parsedArgs: ParsedArgs) {
  const { passWithNoTests } = parsedArgs

  const eslintBin = await throwLeft(() => resolveBin('eslint'))

  const command = [
    process.execPath,
    eslintBin,
    ...process.argv.slice(3).filter((arg) => arg !== '--passWithNoTests'),
  ].join(' ')

  console.log(`> ${command}`)

  const eslintResultEither = await tryCatchAsync(
    () =>
      new Promise<void>((resolve, reject) => {
        const tscProcess = exec(
          command,
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
      }),
  )

  if (isLeft(eslintResultEither)) {
    if (!passWithNoTests) {
      throw eslintResultEither.left
    }

    const error = eslintResultEither.left as Error

    const hasError = [/No files matching/, /find a configuration file/].every(
      (rgx) => !rgx.test(error.message),
    )

    if (hasError) {
      throw eslintResultEither.left
    }
  }
}
