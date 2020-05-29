'use strict';

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var MonacoWebpackPlugin = _interopDefault(
  require('monaco-editor-webpack-plugin')
);

const withTM = require('next-transpile-modules')([
  // `monaco-editor` isn't published to npm correctly: it includes both CSS
  // imports and non-Node friendly syntax, so it needs to be compiled.
  // 'monaco-editor',
]);

const withMonaco = (monacoOptions = {}) => (nextConfig = {}) => {
  return withTM(
    Object.assign({}, nextConfig, {
      webpack(config, options) {
        // const rule = config.module.rules
        //   .find((rule) => rule.oneOf)
        //   .oneOf.find(
        //     (
        //       r // Find the global CSS loader
        //     ) =>
        //       r.issuer && r.issuer.include && r.issuer.include.includes('_app')
        //   );

        // if (rule) {
        //   rule.issuer.include = [
        //     rule.issuer.include, // Allow `monaco-editor` to import global CSS:
        //     /[\\/]node_modules[\\/]monaco-editor[\\/]/, // /[\\/]node_modules[\\/]next-monaco-editor[\\/]/,
        //     // /.[\\/]next-monaco-editor[\\/]/,
        //   ];
        // }

        config.module.rules.push({
          test: /\.monaco\.worker\.(ts|js)$/,
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
          new MonacoWebpackPlugin(
            Object.assign(
              {
                filename: 'static/workers/[name].monaco.worker.js',
                publicPath: '/_next/',
              },
              monacoOptions
            )
          )
        );

        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, options);
        }

        return config;
      },
    })
  );
};
//# sourceMappingURL=next.js.map

module.exports = withMonaco({});
