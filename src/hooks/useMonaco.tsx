import React from 'react';
import type * as monacoApi from 'monaco-editor';
import {
  asDisposable,
  loadMonaco,
  PluginConfig,
  configurePlugins,
} from '../monaco';
import { createContext } from 'create-hook-context';

export interface UseMonacoOptions {
  paths?: { monaco?: string; workers?: string };
  onLoad?: (
    monaco: typeof monacoApi
  ) => monacoApi.IDisposable | monacoApi.IDisposable[] | undefined;
  plugins?: boolean | PluginConfig;
  theme?: string | monacoApi.editor.IStandaloneThemeData;
}

const [MonacoProvider, _, __, MonacoContext] = createContext(
  (
    config: UseMonacoOptions
  ): {
    monaco: typeof monacoApi;
    isLoading: boolean;
  } => useMonaco(config),
  undefined,
  'Monaco'
);

export { MonacoProvider };

export function useMonacoContext() {
  return React.useContext(MonacoContext);
}

export const useMonaco = ({
  paths = {},
  onLoad,
  theme = 'vs-dark',
  plugins = true,
}: UseMonacoOptions = {}) => {
  const contextMonaco = useMonacoContext();
  const [monaco, setMonaco] = React.useState<null | typeof monacoApi>(
    contextMonaco === undefined ? null : contextMonaco.monaco
  );
  const monacoRef = React.useRef(monaco);
  monacoRef.current = contextMonaco?.monaco || monaco;
  React.useEffect(() => {
    if (contextMonaco === undefined && !monacoRef.current) {
      const cancelable = loadMonaco(
        paths.monaco,
        typeof plugins === 'boolean'
          ? plugins
            ? configurePlugins({ worker: { path: paths.workers } as any })
            : []
          : plugins
          ? configurePlugins(plugins)
          : []
      );
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

      return () => cancelable.cancel?.();
    }
  }, []);

  React.useEffect(() => {
    if (onLoad) {
      const disposable = asDisposable(onLoad(monaco));
      return disposable.dispose;
    }
  }, [monaco]);

  React.useEffect(() => {
    if (monaco) {
      console.log('[monaco] setting theme:', theme);
      monaco.editor.setTheme(theme);
    }
  }, [monaco, theme]);

  return {
    monaco: monacoRef.current,
    isLoading: Boolean(monacoRef.current),
  };
};
