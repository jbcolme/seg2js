export default {
    input: 'src/seg2js.src.js',
    output: {
      file: 'seg2js.js',
      format: 'umd',
      name: 'seg2js',
      minifyInternalExports: true
    }
  };

// node_modules/terser/bin/terser --compress --mangle -- seg2js.js > seg2js.min.js