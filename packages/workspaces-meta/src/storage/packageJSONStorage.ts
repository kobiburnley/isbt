import { PackageJSON } from '../model'

export interface PackageJSONStorage {
  read: (dir: string) => Promise<PackageJSON>
}
