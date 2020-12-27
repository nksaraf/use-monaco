import React from 'react';
import type * as monacoApi from 'monaco-editor';
import {
  asDisposable,
  loadMonaco,
  basicLanguages,
  basicLanguagePlugins,
} from '../monaco';
import lightTheme from '../themes/monaco/ayu-light';
import { createContext } from 'create-hook-context';
import useDeepCompareEffect from './useDeepCompareEffect';
import { pluginMap } from '../plugins';

declare global {
  interface Window {
    // add you custom properties and methods
    monaco: typeof monacoApi;
  }
}

type Monaco = typeof monacoApi;

export type MonacoProp = {
  monaco?: Monaco | undefined | null;
};

type PromiseOrNot<T> = Promise<T> | T;

export interface UseMonacoOptions
  extends Partial<Omit<monacoApi.LoaderOptions, 'plugins' | 'languages'>> {
  onLoad?: (
    monaco: typeof monacoApi
  ) => PromiseOrNot<
    monacoApi.IDisposable | monacoApi.IDisposable[] | void | undefined
  >;
  themes?: any;
  defaultEditorOptions?: monacoApi.editor.IEditorOptions;
  plugins?: (
    | keyof typeof pluginMap
    | [keyof typeof pluginMap, any]
    | monacoApi.plugin.IPlugin
  )[];
  languages?: (
    | keyof typeof basicLanguagePlugins
    | [keyof typeof basicLanguagePlugins, any]
    | monacoApi.plugin.IPlugin
  )[];
  onThemeChange?: (theme: any, monaco: typeof monacoApi) => PromiseOrNot<void>;
  theme?:
    | string
    | monacoApi.editor.IStandaloneThemeData
    | (() => PromiseOrNot<monacoApi.editor.IStandaloneThemeData>);
}

const [MonacoProvider, _, __, MonacoContext] = createContext(
  (config: UseMonacoOptions) => useMonaco(config),
  undefined,
  'Monaco'
);

export { MonacoProvider };

export function useMonacoContext() {
  return React.useContext(MonacoContext);
}

let startedLoading = false;

export const useMonaco = ({
  themes,
  onThemeChange = () => {},
  onLoad,
  defaultEditorOptions = {
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    // formatOnSave: true,
  },
  theme = 'ayu-light',
  plugins = [],
  languages = ['javascript', 'typescript', 'html', 'css', 'json'],
  ...loaderOptions
}: UseMonacoOptions = {}): {
  useMonacoEffect: (effect: (obj: Monaco) => void, deps: any[]) => void;
  monaco: Monaco;
  isLoading: boolean;
  defaultEditorOptions?: monacoApi.editor.IEditorOptions;
} => {
  const contextMonaco = useMonacoContext();
  const [monaco, setMonaco] = React.useState<null | Monaco>(
    contextMonaco === undefined ? null : contextMonaco.monaco
  );

  const [monacoRef, useMonacoEffect] = useRefWithEffect<Monaco>(monaco);
  monacoRef.current = contextMonaco?.monaco || monaco;

  React.useEffect(() => {
    let onLoadDisposable: monacoApi.IDisposable;

    async function initializeMonaco(
      monaco: Monaco,
      plugins: any,
      languages: any
    ) {
      let pluginDisposables = await monaco.plugin.install(
        ...plugins
          .map((plug) =>
            typeof plug === 'string' ||
            (Array.isArray(plug) && plug.length === 2)
              ? pluginMap[Array.isArray(plug) ? plug[0] : plug]
                ? pluginMap[Array.isArray(plug) ? plug[0] : plug](
                    Array.isArray(plug) ? plug[1] : {}
                  )
                : undefined
              : plug
          )
          .filter(Boolean),
        ...languages
          .map((plug) =>
            typeof plug === 'string'
              ? basicLanguagePlugins[plug]
                ? basicLanguagePlugins[plug]
                : undefined
              : plug
          )
          .filter(Boolean)
      );

      monaco.editor.defineTheme('ayu-light', lightTheme as any);

      setMonaco(monaco);

      let disposables: any = onLoad ? await onLoad(monaco) : null;
      onLoadDisposable = asDisposable(
        [pluginDisposables, disposables].filter(Boolean)
      );
      window.monaco = monaco;
    }

    // only loading once
    if (contextMonaco === undefined && startedLoading) {
      return;
      // console.warn(
      //   `Detected trying to load monaco from multiple hooks. If you want to use monaco with multiple editors or from multiple components, its better to use a MonacoProvider that wraps your components and initializes monaco.`
      // );
    }

    if (!monacoRef.current && window.monaco) {
      initializeMonaco(window.monaco as any, plugins, languages);

      return () => {
        onLoadDisposable?.dispose?.();
      };
    }

    if (contextMonaco === undefined && !monacoRef.current) {
      startedLoading = true;
      const cancelable = loadMonaco(loaderOptions ?? {});

      cancelable
        .then(async (monaco) => {
          await initializeMonaco(monaco, plugins, languages);
          return monaco;
        })
        .catch((error) =>
          console.error(
            'An error occurred during initialization of Monaco:',
            error
          )
        );

      return () => {
        onLoadDisposable?.dispose?.();
        cancelable.cancel?.();
      };
    }
  }, []);

  useMonacoEffect(
    (monaco) => {
      if (themes) {
        monaco.editor.defineThemes(themes);
        return () => {};
      }
    },
    [themes]
  );

  useMonacoEffect(
    (monaco) => {
      if (onThemeChange) {
        const disposable = monaco.editor.onDidChangeTheme((theme) => {
          onThemeChange(theme, monaco);
        });

        return () => {
          disposable?.dispose?.();
        };
      }
    },
    [onThemeChange]
  );

  useMonacoEffect(
    (monaco) => {
      if (typeof theme === 'function') {
        const returnedTheme: any = theme();
        if ((returnedTheme as Promise<any>).then) {
          returnedTheme.then((result) => {
            monaco.editor.setTheme(result);
          });
        } else {
          monaco.editor.setTheme(returnedTheme);
        }
      } else if (theme) {
        monaco.editor.setTheme(theme);
      }
    },
    [theme]
  );

  return {
    monaco: monacoRef.current,
    useMonacoEffect,
    defaultEditorOptions,
    isLoading: Boolean(monacoRef.current),
  };
};

export function useRefWithEffect<T>(
  initialValue: T
): [
  React.MutableRefObject<T | undefined>,
  (effect: (obj: T) => void, deps: any[]) => void
] {
  const ref = React.useRef<T>(initialValue);
  const useRefEffect = (effect: (obj: T) => void, deps: any[]) => {
    React.useEffect(() => {
      if (ref.current) {
        return effect(ref.current);
      }
    }, [ref.current, ...deps]);
  };

  return [ref, useRefEffect];
}
