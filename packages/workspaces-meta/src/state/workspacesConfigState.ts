import { action, makeObservable, observable } from 'mobx'
import { PackageJSONStorage } from '../storage'
import { PackageJSON } from '../model'
import { isNone, none, Option, some } from 'fp-ts/Option'

export interface WorkspacesConfigStateParams {
  readonly packageJSONStorage: PackageJSONStorage
  readonly envState: {
    cwd: string
  }
}

export class WorkspacesConfigState {
  patterns: string[] = []
  packageJSONOption: Option<PackageJSON> = none

  readonly packageJSONStorage: PackageJSONStorage
  readonly envState: {
    cwd: string
  }

  constructor(params: WorkspacesConfigStateParams) {
    this.packageJSONStorage = params.packageJSONStorage
    this.envState = params.envState

    makeObservable(this, {
      init: action,
      packageJSONOption: observable.ref,
      patterns: observable.ref,
    })
  }

  get packageJSON() {
    if (isNone(this.packageJSONOption)) {
      throw new Error('WorkspacesConfigState.packageJSONOption not initialized')
    }

    return this.packageJSONOption.value
  }

  private getWorkspacesPatterns() {
    const { workspaces = [] } = this.packageJSON

    if (Array.isArray(workspaces)) {
      return workspaces
    }

    const { packages = [] } = workspaces

    return packages
  }

  async init() {
    const { packageJSONStorage, envState } = this

    this.packageJSONOption = some(await packageJSONStorage.read(envState.cwd))

    this.patterns = await this.getWorkspacesPatterns()
  }
}
