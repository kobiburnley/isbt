import { TSConfig } from '../model'

export interface TSConfigUpdateOrCreateOptions {
  path: string
}

export interface TSConfigReadOrCreateOptions {
  path: string
}

export interface TSConfigStorage {
  getRelativeExtends(cwd: string, options: { base: string }): Promise<string>

  readOrCreate(
    cwd: string,
    options: TSConfigReadOrCreateOptions,
  ): Promise<TSConfig>

  updateOrCreate(
    cwd: string,
    patches: Partial<TSConfig>[],
    options: TSConfigUpdateOrCreateOptions,
  ): Promise<TSConfig>
}
