module.exports = {
  presets: [
    [
      'module:@react-native/babel-preset',
      {
        disableImportExportTransform: false,
        lazyImportExportTransform: true,
      },
    ],
  ],
};
