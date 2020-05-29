import { Toolbox } from 'pkger';
export default {
  format: 'cjs,esm,umd',
  typecheck: true,
  entries: ['worker', 'themes'],
  postBuild: (toolbox: Toolbox, config: any) => {
    toolbox.filesystem.copy('public/workers', 'dist/assets/');
  },
};
