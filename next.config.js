const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const withTM = require('next-transpile-modules')([
  // `monaco-editor` isn't published to npm correctly: it includes both CSS
  // imports and non-Node friendly syntax, so it needs to be compiled.
  'monaco-editor',
]);

module.exports = withTM({
  webpack: (config) => {
    const rule = config.module.rules
      .find((rule) => rule.oneOf)
      .oneOf.find(
        (r) =>
          // Find the global CSS loader
          r.issuer && r.issuer.include && r.issuer.include.includes('_app')
      );
    if (rule) {
      rule.issuer.include = [
        rule.issuer.include,
        // Allow `monaco-editor` to import global CSS:
        /[\\/]node_modules[\\/]monaco-editor[\\/]/,
      ];
    }

    config.module.rules.push({
      test: /\.monaco\.worker\.(js|ts)$/,
      use: [
        {
          loader: 'worker-loader',
          options: {
            name: 'static/workers/[name].js',
            publicPath: '/_next/',
          },
        },
        {
          loader: 'babel-loader',
          options: {
            presets: ['next/babel'],
          },
        },
      ],
    });

    config.output.globalObject = 'self';

    config.plugins.push(
      new MonacoWebpackPlugin({
        languages: [
          'json',
          'markdown',
          'css',
          'typescript',
          'javascript',
          'html',
          'graphql',
          'python',
          'scss',
          'yaml',
        ],
        filename: 'static/workers/[name].monaco.worker.js',
      })
    );
    return config;
  },
});
