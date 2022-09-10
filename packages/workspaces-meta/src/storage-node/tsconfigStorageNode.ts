import {
  GetProjectReferencePathOptions,
  TSConfigReadOrCreateOptions,
  TSConfigStorage,
  TSConfigUpdateOrCreateOptions,
} from '../storage'
import { defaultsDeep } from 'lodash'
import path from 'path'
import { promises as fs, readFileSync } from 'fs'
import { TSConfig } from '../model'
import { readConfigFile } from 'typescript'
import { tryCatch } from 'fp-ts/TaskEither'
import { isLeft } from 'fp-ts/Either'
import { jsonFileStringify } from '../util/jsonFileStringify'

export class TSConfigStorageNode implements TSConfigStorage {
  private async writeEmptyTsConfig(
    cwd: string,
    options: TSConfigReadOrCreateOptions,
  ) {
    const tsconfig: TSConfig = {}

    await fs.writeFile(
      path.join(cwd, options.path),
      await jsonFileStringify(tsconfig),
    )

    return tsconfig
  }

  async readOrCreate(
    cwd: string,
    options: TSConfigReadOrCreateOptions,
  ): Promise<TSConfig> {
    const tsConfigPath = path.join(cwd, options.path)

    const tsConfigStatEither = await tryCatch(
      () => fs.stat(tsConfigPath),
      (e) => e,
    )()

    if (isLeft(tsConfigStatEither)) {
      return this.writeEmptyTsConfig(cwd, options)
    }

    const { config, error } = readConfigFile(tsConfigPath, (path1) =>
      readFileSync(path1, 'utf8'),
    )

    if (error != null) {
      console.log(error)
      return this.writeEmptyTsConfig(cwd, options)
    }

    return config
  }

  async getRelativeExtends(cwd: string, options: { base: string }) {
    const baseTSConfigPath = path.relative(cwd, path.join(cwd, options.base))

    return baseTSConfigPath.startsWith('.')
      ? baseTSConfigPath
      : `./${baseTSConfigPath}`
  }

  getProjectReferencePath({
    from,
    to,
    tsconfig,
  }: GetProjectReferencePathOptions) {
    return path.relative(from, path.join(to, tsconfig))
  }

  async updateOrCreate(
    cwd: string,
    patches: Partial<TSConfig>[],
    options: TSConfigUpdateOrCreateOptions,
  ) {
    const existingOrEmpty = await this.readOrCreate(cwd, options)
    const newTSConfig = defaultsDeep(
      existingOrEmpty,
      ...patches.map((patch) => ({
        ...patch,
        references: patch?.references?.map((reference) => ({
          path: path.isAbsolute(reference.path)
            ? path.relative(cwd, path.join(reference.path, options.path))
            : reference.path,
        })),
      })),
    )

    await fs.writeFile(
      path.join(cwd, options.path),
      await jsonFileStringify(newTSConfig),
    )

    return newTSConfig
  }
}
