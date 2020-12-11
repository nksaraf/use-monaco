import type * as monacoApi from 'monaco-editor';
import { asDisposable } from './utils';

declare module 'monaco-editor' {
  export namespace plugin {
    export interface IPlugin {
      (monaco: typeof monacoApi): monacoApi.IDisposable | void;
      dependencies?: string[];
      label?: string;
    }

    export function install(...plugins: IPlugin[]): monacoApi.IDisposable;
  }
}

export const createPlugin = (
  {
    dependencies,
    name,
  }: {
    dependencies?: string[];
    name?: string;
  },
  plugin: monacoApi.plugin.IPlugin
) => {
  plugin.dependencies = dependencies;
  plugin.label = name;
  return plugin;
};

export const compose = (
  ...plugins: monacoApi.plugin.IPlugin[]
): monacoApi.plugin.IPlugin => (obj) => {
  for (var plugin of plugins) {
    plugin(obj);
  }
};

export default (monaco: typeof monacoApi) => {
  const installed = {};
  const waitingFor = {};

  function release(done) {
    if (waitingFor[done]) {
      const disposables = waitingFor[done].map((plugin) => {
        let keepWaiting;
        plugin.dependencies.forEach((dep) => {
          if (!installed[dep]) {
            keepWaiting = true;
          }
        });
        if (!keepWaiting) {
          return installPlugin(plugin);
        } else {
          return null;
        }
      });
      delete waitingFor[done];
      return asDisposable(disposables);
    }
  }

  function installPlugin(plugin: monacoApi.plugin.IPlugin) {
    console.log(`[monaco] installing plugin "${plugin.label ?? plugin.name}"`);
    let d1 = plugin(monaco);

    installed[plugin.label ?? plugin.name] = plugin;

    if (plugin.label) {
      let d2 = release(plugin.label);
      return asDisposable([d1, d2].filter(Boolean) as monacoApi.IDisposable[]);
    }

    return d1;
  }

  Object.assign(monaco, {
    plugin: {
      install: (...plugins: monacoApi.plugin.IPlugin[]) => {
        let disposables: monacoApi.IDisposable[] = [];
        plugins.forEach((plugin) => {
          let waiting;
          plugin.dependencies?.forEach((dep) => {
            if (installed[dep]) {
            } else {
              if (!waitingFor[dep]) {
                waitingFor[dep] = [];
              }
              waitingFor[dep].push(plugin);
              waiting = true;
            }
          });

          if (waiting) {
            return;
          }

          const disposable = installPlugin(plugin);
          if (disposable) disposables.push(disposable);
        });
        return asDisposable(disposables);
      },
    },
  });
  return monaco;
};
