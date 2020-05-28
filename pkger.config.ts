import { Toolbox } from 'pkger';
export default {
  format: 'cjs,esm,umd',
  typecheck: true,
  entries: ['worker'],
  // rollup: (config, options) => {
  //   if (options.format === 'umd') {
  //     console.log(config, options);
  //     const oldExternal = config.external;
  //     config.external = (label) => {
  //       if (label === 'use-deep-compare-effect') {
  //         return false;
  //       }
  //       // @ts-ignore
  //       return oldExternal(...(arguments as any));
  //     };
  //   }
  //   return config;
  // },
  postBuild: (toolbox: Toolbox, config: any) => {
    toolbox.filesystem.copy(
      '.next/static/workers/prettier.monaco.worker.js',
      'dist/assets/prettier.monaco.worker.js'
    );
    toolbox.filesystem.copy(
      'public/workerLoader.js',
      'dist/assets/workerLoader.js'
    );
  },
};
