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

    export interface IRemotePlugin {
      dependencies?: string[];
      name?: string;
      url?: string;
      format?: 'url';
    }

    export function isInstalled(name: string): boolean;

    export function install(
      ...plugins: (IPlugin | IRemotePlugin)[]
    ): Promise<monacoApi.IDisposable>;
  }
}

export const createPlugin = (
  {
    dependencies,
    name,
    format = 'local',
    ...other
  }: {
    dependencies?: string[];
    name?: string;
    format?: 'url' | 'local';
  },
  plugin: monacoApi.plugin.IPlugin
) => {
  plugin.dependencies = dependencies;
  plugin.label = name;
  // plugin.format = format;
  return plugin;
};

export const compose = (
  ...plugins: monacoApi.plugin.IPlugin[]
): monacoApi.plugin.IPlugin => (obj) => {
  for (var plugin of plugins) {
    plugin(obj);
  }
};

import scopeEval from 'scope-eval';

function modularize(text, globals, dependencies) {
  const require = (path) => {
    return dependencies[path];
  };
  const exports = {};
  const module = {
    exports,
  };

  scopeEval(text, { module, exports, require, ...globals });

  return { module, exports };
}

async function fetchPlugin({ url, fetchOptions = {} }) {
  const response = await fetch(url, {
    ...fetchOptions,
  });

  const text = await response.text();

  const code = text;

  const plugin = (monaco) => {
    try {
      modularize(
        code,
        { monaco },
        {
          'monaco-editor-core': monaco,
          'monaco-editor': monaco,
          'use-monaco': monaco,
        }
      );
    } catch (e) {
      console.log('[monaco] Error installing plugin from', url);
    }

    return {
      dispose: () => {},
    };
  };

  return plugin;
}

export const createRemotePlugin = ({
  dependencies,
  name,
  url,
  fetchOptions = {},
}: {
  dependencies?: string[];
  name?: string;
  url?: string;
  fetchOptions?: object;
}) => {
  return createPlugin(
    {
      name,
      dependencies,
    },
    async (monaco) => {
      console.log('[monaco] fetching plugin from', url);
      const remotePlugin = await fetchPlugin({ url, fetchOptions });
      return remotePlugin(monaco);
    }
  );
};

export default (monaco: typeof monacoApi) => {
  const installed = {};
  // monaco.loader.includeBasicLanguages
  //   ? Object.fromEntries(
  //       basicLanguages.map((lang) => [`language.${lang}`, true as any])
  //     )
  //   : {};
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
      return asDisposable(disposables.filter(Boolean));
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

  // returns whether to continue to install (true), or not install and wait (false)
  async function checkDependencies(plugin: monacoApi.plugin.IPlugin) {
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
      return false;
    }

    return true;
  }

  Object.assign(monaco, {
    plugin: {
      isInstalled: (name: string) => !!installed[name],
      install: async (...plugins) => {
        let disposables: any[] = [];
        for (var i in plugins) {
          let plugin = plugins[i];

          plugin =
            typeof plugin === 'function'
              ? plugin
              : plugin.url
              ? await fetchPlugin(plugin)
              : null;

          if (!plugin) {
            throw new Error(`Couldn't resolve plugin, ${plugin}`);
          }

          plugin.label = plugin.label ?? plugin.name;

          if (installed[plugin.label]) {
            console.log(
              `[monaco] skipped installing ${plugin.label} (already installed)`
            );
            return;
          }

          if (!(await checkDependencies(plugin))) {
            continue;
          }

          disposables.push(await installPlugin(plugin));
        }

        return asDisposable(disposables.filter(Boolean));
      },
    },
  });
  return monaco;
};
