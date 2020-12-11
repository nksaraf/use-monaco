import * as monacoApi from 'monaco-editor';
import { createPlugin } from '../../monaco';

declare module 'monaco-editor' {
  namespace editor {
    // interface IStandaloneCodeEditor {
    //   addSelectAction: (action: IQuickSelectAction) => monacoApi.IDisposable;
    // }

    export function setTheme(themeName: string | IStandaloneThemeData): void;
    export function onDidChangeTheme(
      listener: (theme: string) => void
    ): monacoApi.IDisposable;
  }
}

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

export default ({ themes, onThemeChange }) =>
  createPlugin({ name: 'core.theme', dependencies: [] }, (monaco) => {
    const setTheme = monaco.editor.setTheme;
    const _onDidChangeTheme = new monaco.Emitter<string>();
    monaco.editor.onDidChangeTheme = _onDidChangeTheme.event;
    monaco.editor.setTheme = (
      theme: string | monacoApi.editor.IStandaloneThemeData
    ) => {
      if (typeof theme === 'string') {
        setTheme(theme);
        _onDidChangeTheme.fire(theme);
      } else if (typeof theme === 'object') {
        monaco.editor.defineTheme('custom', theme);
        setTheme('custom');
        _onDidChangeTheme.fire('custom');
      }
    };

    setupThemes(monaco, themes);
    const themeListener = monaco.editor.onDidChangeTheme((theme) =>
      onThemeChange(theme, monaco)
    );
    return themeListener;
  });
