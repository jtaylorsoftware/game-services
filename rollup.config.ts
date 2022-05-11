import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'
import ignore from 'rollup-plugin-ignore'

export default [
  {
    input: 'packages/games/lambda/get-games.ts',
    output: {
      format: 'es',
      file: 'bundles/get-games/index.js',
    },
    plugins: [
      resolve({ exportConditions: ['node'] }),
      commonjs(),
      json(),
      typescript({
        tsconfig: 'packages/games/tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
  {
    input: 'packages/scores/lambda/get-top-scores.ts',
    output: {
      format: 'es',
      file: 'bundles/get-top-scores/index.js',
    },
    plugins: [
      resolve({ exportConditions: ['node'] }),
      commonjs(),
      json(),
      typescript({
        tsconfig: 'packages/scores/tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
  {
    input: 'packages/scores/lambda/save-score.ts',
    output: {
      format: 'es',
      file: 'bundles/save-score/index.js',
    },
    plugins: [
      ignore(['superagent-proxy']),
      resolve({ exportConditions: ['node'], preferBuiltins: true }),
      replace({
        preventAssignment: true,
        'global.GENTLY': false,
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: 'packages/scores/tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
]
