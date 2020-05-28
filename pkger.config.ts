import { Toolbox } from 'pkger';
export default {
  format: 'cjs,esm,umd',
  typecheck: true,
  entries: ['worker'],
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
