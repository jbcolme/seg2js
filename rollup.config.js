import { terser } from "rollup-plugin-terser";

let terserOptions = {
    compress: {defaults: true},
    mangle: {}
}

export default {
    input: 'src/seg2js.src.js',
    output: {
      file: 'seg2js.min.js',
      format: 'umd',
      name: 'seg2js',
      minifyInternalExports: true
    },
    plugins: [terser(terserOptions)]
  };

