import type * as monacoApi from 'monaco-editor';
import { asDisposable } from './utils';

declare module 'monaco-editor' {
  export namespace plugin {
    export interface IPlugin {
      (monaco: typeof monacoApi):
        | monacoApi.IDisposable
        | void
        | Promise<void>
        | Promise<monacoApi.IDisposable>;
      dependencies?: string[];
      label?: string;
    }

    export function install(
      ...plugins: IPlugin[]
    ): Promise<monacoApi.IDisposable>;
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

  async function installPlugin(plugin: monacoApi.plugin.IPlugin) {
    console.log(`[monaco] installing plugin: ${plugin.label ?? plugin.name}`);
    let d1 = await plugin(monaco);

    installed[plugin.label ?? plugin.name] = plugin;

    if (plugin.label) {
      let d2 = release(plugin.label);
      return asDisposable([d1, d2].filter(Boolean) as monacoApi.IDisposable[]);
    }

    return d1;
  }

  Object.assign(monaco, {
    plugin: {
      install: async (...plugins: monacoApi.plugin.IPlugin[]) => {
        let disposables: monacoApi.IDisposable[] = [];
        for (var i in plugins) {
          const plugin = plugins[i];

          if (installed[plugin.label]) {
            return;
          }
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

          const disposable = await installPlugin(plugin);
          if (disposable) disposables.push(disposable);
        }

        return asDisposable(disposables);
      },
    },
  });
  return monaco;
};
