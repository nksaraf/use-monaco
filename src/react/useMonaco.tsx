import React from 'react';
import type * as monacoApi from 'monaco-editor';
import { asDisposable, loadMonaco, basicLanguagePlugins } from '../monaco';
import { createContext } from 'create-hook-context';
import { pluginMap } from '../plugins';

type Monaco = typeof monacoApi;

declare global {
  interface Window {
    monaco: Monaco;
  }
}

interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

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

// Monaco Provider

interface CreatedMonacoContext {
  monaco: Monaco;
  isLoading: boolean;
  useMonacoEffect: (
    cb: (monaco?: Monaco) => void | (() => void),
    deps?: any[]
  ) => void;
  defaultEditorOptions?: monacoApi.editor.IEditorOptions;
}

const [MonacoProvider, _, __, MonacoContext] = createContext<
  CreatedMonacoContext,
  UseMonacoOptions
>((config: UseMonacoOptions) => useMonaco(config), undefined, 'Monaco');

export { MonacoProvider };

export function useMonacoContext() {
  const context = React.useContext(MonacoContext);
  return context;
}

export const useMonaco = ({
  themes,
  onThemeChange = () => {},
  onLoad,
  defaultEditorOptions = {
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
  },
  plugins = [],
  theme,
  languages = ['javascript', 'typescript', 'html', 'css', 'json'],
  ...loaderOptions
}: UseMonacoOptions = {}): CreatedMonacoContext => {
  // Loading (unset once we have initialized monaco)
  const [isLoading, setIsLoading] = React.useState(true);

  // Set monaco context to state
  const contextMonaco = useMonacoContext();

  // Monaco instance (use the one in context if we have it)
  const [monaco, setMonaco] = React.useState<null | Monaco>(() =>
    contextMonaco ? contextMonaco.monaco : null
  );

  // Load and/or initialize monaco
  React.useEffect(() => {
    let cancelable: CancellablePromise<Monaco>;
    let pluginDisposable: monacoApi.IDisposable;
    let onLoadDisposable: monacoApi.IDisposable;

    // This effect should only run in the browser
    if (typeof window === 'undefined') return;

    // If we have monaco already....
    if (monaco) {
      if (!window.monaco) window.monaco = monaco;
      if (isLoading) setIsLoading(false);
      return;
    }

    // If we need to get monaco into state...
    async function initializeMonaco() {
      let monaco: Monaco = window.monaco;

      // Load monaco if necessary.
      if (monaco === undefined) {
        cancelable = loadMonaco(loaderOptions ?? {});
        monaco = await cancelable;
      }

      // Install and setup plugins.
      pluginDisposable = await monaco.plugin.install(
        ...getPlugins(plugins, languages)
      );

      // Perform any onLoad tasks.
      if (onLoad) {
        const disposables = await onLoad(monaco);
        if (disposables) {
          onLoadDisposable = asDisposable(
            Array.isArray(disposables) ? disposables : [disposables]
          );
        }
      }

      // Save monaco to window and state.
      window.monaco = monaco;
      setMonaco(monaco);
      setIsLoading(false);
    }

    initializeMonaco().catch((error) =>
      console.error('An error occurred during initialization of Monaco:', error)
    );

    return () => {
      cancelable?.cancel?.();
      pluginDisposable?.dispose();
      onLoadDisposable?.dispose();
    };
  }, [monaco]);

  // Handle changed plugins or languages
  React.useEffect(() => {
    if (!monaco) return;
    // Install and setup plugins.
    let disposable: monacoApi.IDisposable;

    monaco.plugin
      .install(...getPlugins(plugins, languages))
      .then((d) => (disposable = asDisposable(d)));

    return () => {
      disposable?.dispose();
    };
  }, [monaco, plugins, languages]);

  // Setup onThemeChange event handler
  React.useEffect(() => {
    if (!monaco) return;
    if (!onThemeChange) return;

    const disposable = monaco.editor.onDidChangeTheme((theme) => {
      onThemeChange(theme, monaco);
    });

    return () => {
      disposable?.dispose?.();
    };
  }, [monaco, onThemeChange, theme]);

  // Setup theme and themes
  React.useEffect(() => {
    if (!monaco) return;

    // Setup themes
    if (!!themes) {
      monaco.editor.defineThemes(themes);
    }

    // Set the current theme
    if (!!theme) {
      let themeToSet = typeof theme === 'function' ? theme() : theme;

      if (typeof themeToSet === 'string' || !('then' in themeToSet)) {
        monaco.editor.setTheme(themeToSet);
      } else {
        themeToSet.then(monaco.editor.setTheme);
      }
    }
  }, [monaco, theme, themes]);

  // A hook to run changes when monaco changes. (Maybe not needed?)
  const useMonacoEffect = React.useCallback(
    (cb: (monaco?: Monaco) => void | (() => void), deps: any[] = []) => {
      return React.useEffect(() => monaco && cb(monaco), [monaco, ...deps]);
    },
    [monaco]
  );

  return {
    monaco,
    useMonacoEffect,
    defaultEditorOptions,
    isLoading,
  };
};

// Other stuff

function getPlugins(
  plugins: UseMonacoOptions['plugins'],
  languages: UseMonacoOptions['languages']
) {
  return [
    ...plugins
      .map((plug) =>
        typeof plug === 'string' || (Array.isArray(plug) && plug.length === 2)
          ? pluginMap[Array.isArray(plug) ? plug[0] : plug]
            ? pluginMap[Array.isArray(plug) ? plug[0] : plug](
                Array.isArray(plug) ? plug[1] : {}
              )
            : undefined
          : plug
      )
      .filter(Boolean),
    ...(languages as (string | [string, any] | monacoApi.plugin.IPlugin)[])
      .map((plug) =>
        typeof plug === 'string'
          ? basicLanguagePlugins[plug]
            ? basicLanguagePlugins[plug]
            : undefined
          : plug
      )
      .filter(Boolean),
  ];
}

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
