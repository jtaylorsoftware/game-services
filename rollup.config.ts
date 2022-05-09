import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

// Just an example of using rollup - only Lambda functions
// will be output as bundles eventually
export default [
  {
    input: './packages/scores/index.ts',
    output: {
      format: 'es',
      file: './packages/scores/dist/index.bundle.js',
    },
    plugins: [resolve(), commonjs(), json(), typescript()],
  },
]
