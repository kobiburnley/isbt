import * as io from 'io-ts'

export const TSConfig = io.partial({
  extends: io.string,
  compilerOptions: io.partial({
    outDir: io.string,
    rootDir: io.string,
    module: io.union([io.literal('esnext'), io.literal('commonjs')]),
  }),
  include: io.array(io.string),
  exclude: io.array(io.string),
  references: io.array(
    io.type({
      path: io.string,
    }),
  ),
})