import * as monacoApi from 'monaco-editor';
import workerAddons from './worker-client';
import languagesAddon from './languages';
import editorAddons from './editor';
import pluginsAddon from './plugin';

// export { monaco };
// export * from '../utils';

const pipe = <T>(a: T, ...addons: ((t: T) => T)[]) => {
  for (var addon of addons) {
    a = addon(a);
  }
  return a;
};

export default (monaco: typeof monacoApi) => {
  workerAddons(monaco);
  return pipe(monaco, workerAddons, languagesAddon, editorAddons, pluginsAddon);
};

// registerLanguage({
// 	id: 'typescript',
// 	extensions: ['.ts', '.tsx'],
// 	aliases: ['TypeScript', 'ts', 'typescript'],
// 	mimetypes: ['text/typescript'],
// 	loader: () => <Promise<any>>import('./typescript')
// });
