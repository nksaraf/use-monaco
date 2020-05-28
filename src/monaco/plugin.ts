import * as monacoApi from 'monaco-editor';
import { asDisposable } from '../utils';

declare module 'monaco-editor' {
  namespace plugin {
    interface IPlugin {
      (monaco: typeof monacoApi): monacoApi.IDisposable | void;
    }

    function install(...plugins: IPlugin[]): monacoApi.IDisposable;
  }
}

export default (monaco: typeof monacoApi) => {
  Object.assign(monaco, {
    plugin: {
      install: (...plugins: monacoApi.plugin.IPlugin[]) => {
        const disposables: monacoApi.IDisposable[] = [];
        plugins.forEach((plugin) => {
          let disposable = plugin(monaco);
          disposable && disposables.push(disposable);
        });
        return asDisposable(disposables);
      },
    },
  });
  return monaco;
};

// @ts-ignore

// monaco.
