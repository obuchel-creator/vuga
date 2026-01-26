const metroBabelTransformer = require('metro-react-native-babel-transformer');

module.exports = {
  process(src, filename, config, options) {
    return metroBabelTransformer.transform({
      src,
      filename,
      options: { ...options, babelTransformerPath: require.resolve('metro-react-native-babel-transformer') },
      plugins: [],
    });
  },
};
