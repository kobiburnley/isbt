import path from 'path'
import { promises as fs } from 'fs'
import { tryCatch } from '@isbt/standard'
import { isLeft } from '@isbt/standard/Either'

export async function resolveBin(
  packageName: string,
  {
    script = packageName,
    cwd = process.cwd(),
  }: { cwd?: string; script?: string } = {},
) {
  const packageJSONPathEither = tryCatch(() =>
    require.resolve(`${packageName}/package.json`, {
      paths: [cwd],
    }),
  )

  if (isLeft(packageJSONPathEither)) {
    return packageJSONPathEither
  }

  const { right: packageJSONPath } = packageJSONPathEither

  const tsPackagePath = path.dirname(packageJSONPath)
  const { bin } = JSON.parse((await fs.readFile(packageJSONPath)).toString())

  return tryCatch(() =>
    require.resolve(bin[script], {
      paths: [tsPackagePath],
    }),
  )
}
