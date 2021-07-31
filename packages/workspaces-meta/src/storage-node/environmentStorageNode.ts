import { EnvironmentStorage } from '../storage'

export class EnvironmentStorageNode implements EnvironmentStorage {
  async getCwd() {
    return process.cwd()
  }
}
