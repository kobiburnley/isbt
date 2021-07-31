import { PackageJSONStorage } from '../storage'
import readPackageAsync from 'read-pkg'

export class PackageJSONStorageNode implements PackageJSONStorage {
  async read(dir: string) {
    return readPackageAsync({
      cwd: dir,
    })
  }
}
