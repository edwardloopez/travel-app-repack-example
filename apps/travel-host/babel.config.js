module.exports = {
  presets: [
    [
      'module:@react-native/babel-preset', 
      {
        disableImportExportTransform: false,
        lazyImportExportTransform: true,
      }
    ]
  ],
  plugins: [
    'transform-inline-environment-variables',
  ],
};
