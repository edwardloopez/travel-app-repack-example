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
        include: [
          'REMOTE_PROFILE',
          'REMOTE_STATIC_BASE_URL',
          'REMOTE_REGISTRY_URL',
          'HOST_IP_ADDRESS',
        ],
      },
    ],
  ],
};
