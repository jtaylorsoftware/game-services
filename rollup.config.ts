import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'

export default [
  {
    input: './packages/scores/index.ts',
    output: {
      format: 'es',
      file: './packages/scores/dist/index.bundle.js',
    },
    plugins: [resolve(), typescript()],
  },
]
