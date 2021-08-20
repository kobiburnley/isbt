import { copy, readdir } from 'fs-extra'
import { tryCatch, tryCatchAsync } from 'fp-error'
import { isLeft, left } from 'fp-ts/Either'
import { IsbtCreateError } from './isbtCreateError'
import path from 'path'

export async function create(cwd: string) {
  const readDirResultEither = await tryCatchAsync(() => readdir(cwd))

  if (isLeft(readDirResultEither)) {
    return left(
      new IsbtCreateError({
        message: `Cannot read dir ${cwd}`,
        cause: readDirResultEither.left,
      }),
    )
  }

  const { right: readDirResult } = readDirResultEither
  if (readDirResult.length) {
    return left(
      new IsbtCreateError({
        message: `Directory ${cwd} must be empty, found ${readDirResult.length} files.`,
      }),
    )
  }

  const templatePathEither = tryCatch(() => {
    const packageJsonPath = require.resolve('@isbt/create/package.json')
    return path.join(path.dirname(packageJsonPath), 'template')
  })

  if (isLeft(templatePathEither)) {
    return left(
      new IsbtCreateError({
        message: `Unexpected trying to resolve template directory`,
        cause: templatePathEither.left,
      }),
    )
  }

  const { right: templatePath } = templatePathEither

  const copyDirResultEither = await tryCatchAsync(() =>
    copy(templatePath, cwd, { filter: (src) => src !== 'package.json' }),
  )

  if (isLeft(copyDirResultEither)) {
    return left(
      new IsbtCreateError({
        message: `Cannot copy dir ${templatePath}`,
        cause: copyDirResultEither.left,
      }),
    )
  }

  return copyDirResultEither
}
