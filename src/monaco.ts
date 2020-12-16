export * from './core';
import * as monacoPlugins from './plugins';

import type * as monacoApi from 'monaco-editor';
import { noop } from './core';

export { monacoPlugins as plugins };

export interface PluginConfig {
  editor?: boolean;
  worker?: boolean | Parameters<typeof monacoPlugins.worker>[0];
  theme?: boolean | Parameters<typeof monacoPlugins.theme>[0];
  prettier?: boolean | Parameters<typeof monacoPlugins.prettier>[0];
  shortcuts?: boolean;
  languages?: boolean;
  typings?: boolean | Parameters<typeof monacoPlugins.typings>[0];
  graphql?: boolean | Parameters<typeof monacoPlugins.graphql>[0];
  [key: string]: boolean | object | monacoApi.plugin.IPlugin;
}

export function configurePlugins({
  editor = true,
  worker = { path: undefined },
  theme = { themes: {}, onThemeChange: noop },
  prettier = false,
  shortcuts = true,
  languages = true,
  typings = false,
  graphql = false,
  ...other
}: PluginConfig = {}): monacoApi.plugin.IPlugin[] {
  return [
    editor && monacoPlugins.editor,
    worker &&
      monacoPlugins.worker(typeof worker === 'boolean' ? undefined : worker),
    theme &&
      monacoPlugins.theme(typeof theme === 'boolean' ? undefined : theme),
    shortcuts && monacoPlugins.shortcuts,
    languages && monacoPlugins.languages,
    typings &&
      monacoPlugins.typings(typeof typings === 'boolean' ? undefined : typings),
    graphql &&
      monacoPlugins.graphql(typeof graphql === 'boolean' ? undefined : graphql),
    prettier &&
      monacoPlugins.prettier(
        typeof prettier === 'boolean' ? undefined : prettier
      ),
    ...Object.keys(other).map((pluginName) => {
      const plugin = other[pluginName] as monacoApi.plugin.IPlugin;
      plugin.label = pluginName;
      return plugin;
    }),
  ].filter(Boolean);
}
