import type * as monacoApi from 'monaco-editor';
import { createPlugin } from '../../monaco';
import polyfillTheme from './utils/polyfill-theme';
import { convertTheme, IVSCodeTheme } from './vscode-to-monaco-theme';

declare module 'monaco-editor' {
  namespace editor {
    export function defineTheme(
      themeName: string,
      theme: monacoApi.editor.IStandaloneThemeData | IVSCodeTheme
    ): void;

    export function setTheme(
      themeName: string | monacoApi.editor.IStandaloneThemeData | IVSCodeTheme
    ): void;
  }
}

export default ({ transformTheme = (t) => t, polyfill = true } = {}) =>
  createPlugin(
    { name: 'vscode.themes', dependencies: ['core.themes'] },
    (monaco) => {
      let oldDefineTheme = monaco.editor.defineTheme;
      monaco.editor.defineTheme = (
        themeName: string,
        theme: monacoApi.editor.IStandaloneThemeData | IVSCodeTheme
      ) => {
        if (
          '$schema' in theme &&
          theme['$schema'] === 'vscode://schemas/color-theme'
        ) {
          const converted = convertTheme(theme);
          const polyfilledColors = polyfillTheme(converted);
          oldDefineTheme(
            themeName,
            transformTheme?.({ ...converted, colors: polyfilledColors })
          );
        } else {
          oldDefineTheme(themeName, theme);
        }
      };
    }
  );
//
