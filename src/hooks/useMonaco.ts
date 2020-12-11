import { useEffect } from 'react';
import React from 'react';
import type * as monacoApi from 'monaco-editor';
import { asDisposable, noop } from '../monaco/utils';
import loadMonaco from '../monaco';

import * as corePlugins from '../plugins/core';

export interface UseMonacoOptions {
  paths?: {
    monaco?: string;
    workers?: string;
  };
  onLoad?: (
    monaco: typeof monacoApi
  ) => monacoApi.IDisposable | monacoApi.IDisposable[] | undefined;
  plugins?: monacoApi.plugin.IPlugin[];
  onThemeChange?: (theme: string, monaco: typeof monacoApi) => void;
  themes?: { [key: string]: monacoApi.editor.IStandaloneThemeData | any };
  theme?: string | monacoApi.editor.IStandaloneThemeData;
}

export const useMonaco = ({
  paths,
  onLoad = noop,
  themes = {},
  theme = 'vs-dark',
  onThemeChange = noop,
  plugins = [],
}: UseMonacoOptions = {}) => {
  const [monaco, setMonaco] = React.useState<null | typeof monacoApi>(null);
  const monacoRef = React.useRef(monaco);
  monacoRef.current = monaco;
  useEffect(() => {
    const cancelable = loadMonaco(paths.monaco, [
      corePlugins.editor,
      corePlugins.shortcuts,
      corePlugins.worker(paths.workers),
      corePlugins.languages,
      corePlugins.theme({ themes, onThemeChange }),
      ...plugins,
    ]);
    cancelable
      .then((monaco) => {
        setMonaco(monaco);
      })
      .catch((error) =>
        console.error(
          'An error occurred during initialization of Monaco:',
          error
        )
      );

    return cancelable.cancel;
  }, []);

  useEffect(() => {
    const disposable = asDisposable(onLoad(monaco));
    return disposable.dispose;
  }, [monaco]);

  React.useEffect(() => {
    if (monaco) {
      console.log('[monaco] setting theme:', theme)
      monaco.editor.setTheme(theme);
    }
  }, [monaco, theme]);

  return {
    monaco,
    loading: Boolean(monaco),
  };
};
