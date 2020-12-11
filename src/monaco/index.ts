import * as monacoApi from 'monaco-editor';
import workerAddons from './worker';
import languagesAddon from './languages';
import editorAddons from './editor';
import pluginsAddon from './plugin';

const pipe = <T>(a: T, ...addons: ((t: T) => T)[]) => {
  for (var addon of addons) {
    a = addon(a);
  }
  return a;
};

export * from './worker';
export default (monaco: typeof monacoApi) => {
  return pipe(monaco, workerAddons, languagesAddon, editorAddons, pluginsAddon);
};

export const loadMonaco = (path: string) => {
  
};
