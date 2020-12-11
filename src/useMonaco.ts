import { useEffect } from 'react';
import React from 'react';
import * as monacoApi from 'monaco-editor';
import addons from './monaco';
import { noEndingSlash, noop } from './monaco/utils';
import { monacoLoader } from './monaco/loader';

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
    monaco?: string;
    workers?: string;
  };
  onLoad?: (monaco: typeof monacoApi) => (() => void) | void;
  plugins?: monacoApi.plugin.IPlugin[];
  onThemeChange?: (theme: string, monaco: typeof monacoApi) => void;
  themes?: { [key: string]: monacoApi.editor.IStandaloneThemeData | any };
  theme?: string | monacoApi.editor.IStandaloneThemeData;
}

export interface Monaco {
  monaco: typeof monacoApi | null;
}

export const useMonaco = ({
  paths: {
    monaco = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/min/vs',
    workers = 'https://cdn.jsdelivr.net/npm/use-monaco/dist/workers',
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
    const cancelable = monacoLoader.init({ paths: { vs: monaco } });
    cancelable
      .then((monaco) => {
        monaco = addons(monaco);
        monaco.worker.setup(workers);
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
