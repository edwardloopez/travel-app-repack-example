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
    [
      'transform-inline-environment-variables',
      {
        include: ['REMOTE_PROFILE', 'HOST_IP_ADDRESS'],
      },
    ],
  ],
};
