import * as io from 'io-ts'

export const Customization = io.readonly(
  io.type({
    tsconfig: io.readonly(
      io.type({
        extends: io.string,
        include: io.array(io.string),
        outDir: io.string,
        rootDir: io.string,
        base: io.string,
        cjsName: io.string,
        esmName: io.string,
      }),
    ),
  }),
)
