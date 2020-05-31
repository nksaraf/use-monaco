import { useEffect } from 'react';
import React from 'react';
import * as monacoApi from 'monaco-editor';
import addons from './monaco';
import { noop } from './utils';

interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

const merge = (target: { [x: string]: any }, source: { [x: string]: any }) => {
  Object.keys(source).forEach((key) => {
    if (source[key] instanceof Object)
      target[key] &&
        Object.assign(source[key], merge(target[key], source[key]));
  });
  return { ...target, ...source };
};

const makeCancelable = function <T>(
  promise: Promise<T>
): CancellablePromise<T> {
  let hasCanceled_ = false;
  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then((val) =>
      hasCanceled_ ? reject('operation is manually canceled') : resolve(val)
    );
    promise.catch((error) => reject(error));
  });
  const cancellablePromise = Object.assign(wrappedPromise, {
    cancel: () => (hasCanceled_ = true),
  });
  return cancellablePromise;
};

export class MonacoLoader {
  config: any;
  constructor() {
    this.config = {};
  }
  resolve: any;
  reject: any;
  injectScripts(script: HTMLScriptElement) {
    document.body.appendChild(script);
  }
  handleMainScriptLoad = () => {
    document.removeEventListener('monaco_init', this.handleMainScriptLoad);
    this.resolve((window as any).monaco);
  };
  createScript(src?: string) {
    const script = document.createElement('script');
    return src && (script.src = src), script;
  }
  createMonacoLoaderScript(mainScript: HTMLScriptElement) {
    const loaderScript = this.createScript(`${this.config.paths.vs}/loader.js`);
    loaderScript.onload = () => this.injectScripts(mainScript);
    loaderScript.onerror = this.reject;
    return loaderScript;
  }

  createMainScript() {
    const mainScript = this.createScript();
    mainScript.innerHTML = `
      require.config(${JSON.stringify(this.config)});
      require(['vs/editor/editor.main'], function() {
        document.dispatchEvent(new Event('monaco_init'));
      });
    `;
    mainScript.onerror = this.reject;
    return mainScript;
  }
  isInitialized = false;
  wrapperPromise = new Promise<typeof monacoApi>((res, rej) => {
    this.resolve = res;
    this.reject = rej;
  });
  init(config: any): CancellablePromise<typeof monacoApi> {
    if (!this.isInitialized) {
      //@ts-ignore
      if (window.monaco && window.monaco.editor) {
        //@ts-ignore
        return new Promise((res, rej) => res(window.monaco));
      }
      this.config = merge(this.config, config);
      document.addEventListener('monaco_init', this.handleMainScriptLoad);
      const mainScript = this.createMainScript();
      const loaderScript = this.createMonacoLoaderScript(mainScript);
      this.injectScripts(loaderScript);
    }
    this.isInitialized = true;
    return makeCancelable(this.wrapperPromise);
  }
}

export const monacoLoader = new MonacoLoader();

function setupThemes(
  monaco: typeof monacoApi,
  // editor: monacoApi.editor.IStandaloneCodeEditor,
  themes: any
) {
  const allThemes = {
    // ...defaultThemes,
    ...themes,
  };

  Object.keys(allThemes).forEach((themeName) => {
    monaco.editor.defineTheme(
      themeName,
      allThemes[themeName as keyof typeof allThemes]
    );
  });

  // editor.addSelectAction({
  //   id: 'editor.action.selectTheme',
  //   label: 'Preferences: Color Theme',
  //   choices: () => Object.keys(themeNames),
  //   runChoice: (choice, mode, ctx, api) => {
  //     if (mode === 0) {
  //       api.editor.setTheme(themeNames[choice]);
  //     } else if (mode === 1) {
  //       api.editor.setTheme(themeNames[choice]);
  //     }
  //   },
  //   runAction: function (editor: any, api: any) {
  //     const _this: any = this;
  //     const currentTheme = editor._themeService._theme.themeName;
  //     console.log(currentTheme);
  //     const controller = _this.getController(editor);
  //     const oldDestroy = controller.widget.quickOpenWidget.callbacks.onCancel;
  //     controller.widget.quickOpenWidget.callbacks.onCancel = function () {
  //       debugger;
  //       monaco.editor.setTheme(currentTheme);
  //       oldDestroy();
  //     };
  //     console.log(
  //       controller,
  //       controller.widget.quickOpenWidget.callbacks.onCancel,
  //       this
  //     );
  //     _this.show(editor);
  //     return Promise.resolve();
  //   },
  // });
}

export interface UseMonacoOptions {
  paths?: {
    vs?: string;
  };
  onLoad?: (monaco: typeof monacoApi) => (() => void) | void;
  plugins?: monacoApi.plugin.IPlugin[];
  onThemeChange?: (theme: string, monaco: typeof monacoApi) => void;
  themes?: { [key: string]: monacoApi.editor.IStandaloneThemeData };
  theme?: string | monacoApi.editor.IStandaloneThemeData;
}

export interface Monaco {
  monaco: typeof monacoApi | null;
}

export const useMonaco = ({
  paths: {
    vs = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/min/vs',
  } = {},
  onLoad = noop,
  plugins = [],
  themes = {},
  theme = 'vs-dark',
  onThemeChange = noop,
}: UseMonacoOptions = {}) => {
  const [isMonacoMounting, setIsMonacoMounting] = React.useState(true);
  const monacoRef = React.useRef<null | typeof monacoApi>(null);
  const cleanupRef = React.useRef<() => void>();

  useEffect(() => {
    const cancelable = monacoLoader.init({ paths: { vs } });
    cancelable
      .then((monaco) => {
        monaco = addons(monaco);
        monaco.worker.setup();
        var pluginDisposables = monaco.plugin.install(...plugins);

        // CMD + Shift + P (like vscode), CMD + Shift + C
        const themeListener = monaco.editor.onDidChangeTheme((theme) =>
          onThemeChange(theme, monaco)
        );

        setupThemes(monaco, themes);

        var onLoadCleanup = onLoad?.(monaco) as any;
        cleanupRef.current = () => {
          themeListener.dispose();
          pluginDisposables.dispose();
          if (onLoadCleanup) {
            onLoadCleanup();
          }
        };
        monacoRef.current = monaco;
        setIsMonacoMounting(false);
      })
      .catch((error) =>
        console.error(
          'An error occurred during initialization of Monaco:',
          error
        )
      );
    return () => {
      cancelable.cancel();
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  React.useEffect(() => {
    if (monacoRef.current) monacoRef.current.editor.setTheme(theme);
  }, [monacoRef.current, theme]);

  return {
    monaco: monacoRef.current,
    loading: Boolean(monacoRef.current),
  };
};
