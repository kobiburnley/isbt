import * as io from 'io-ts'
import { NormalizedPackageJson } from 'read-pkg'

export const PackageJSON = io.unknown as io.Type<NormalizedPackageJson>
