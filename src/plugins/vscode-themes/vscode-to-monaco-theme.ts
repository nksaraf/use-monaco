import Color from 'color';
import type * as monaco from 'monaco-editor';
import polyfillTheme from './utils/polyfill-theme';

export interface IVSCodeTheme {
  $schema: 'vscode://schemas/color-theme';
  type: 'dark' | 'light';
  colors: { [name: string]: string };
  tokenColors: {
    name?: string;
    scope: string[] | string;
    settings: {
      foreground?: string;
      background?: string;
      fontStyle?: string;
    };
  }[];
}

export type IMonacoThemeRule = monaco.editor.ITokenThemeRule[];

function validateColor(color: string) {
  const c = Color(color);

  return c.hex();
}

export function convertTheme(
  theme: IVSCodeTheme
): monaco.editor.IStandaloneThemeData {
  const colors = Object.fromEntries(
    Object.entries(theme.colors ?? {})
      .map(([k, v]) => {
        try {
          if (k.split('.').length === 2) return [k, validateColor(v)];
          else {
            return null;
          }
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
  );

  const monacoThemeRule: IMonacoThemeRule = [
    {
      token: 'unmatched',
      foreground:
        colors['editor.foreground'] ?? colors['foreground'] ?? '#bbbbbb',
    },
  ];

  const returnTheme: monaco.editor.IStandaloneThemeData = {
    inherit: false,
    base: 'vs-dark',
    colors: colors,
    rules: monacoThemeRule,
    encodedTokensColors: [],
  };

  theme.tokenColors.map((color) => {
    if (typeof color.scope == 'string') {
      const split = color.scope.split(/[, ]/g);

      if (split.length > 1) {
        color.scope = split;
        evalAsArray();
        return;
      }

      monacoThemeRule.push(
        Object.assign(
          {},
          Object.fromEntries(
            Object.entries(color.settings).map(([k, v]) => [
              k,
              ['foreground', 'background'].includes(k) ? validateColor(v) : v,
            ])
          ),
          {
            // token: color.scope.replace(/\s/g, '')
            token: color.scope,
          }
        )
      );
      return;
    }

    if (!color.scope) {
      return;
    }

    evalAsArray();

    function evalAsArray() {
      (color.scope as string[]).map((scope) => {
        monacoThemeRule.push(
          Object.assign(
            {},
            Object.fromEntries(
              Object.entries(color.settings).map(([k, v]) => [
                k,
                ['foreground', 'background'].includes(k) ? validateColor(v) : v,
              ])
            ),
            {
              token: scope,
            }
          )
        );
      });
    }
  });

  return returnTheme;
}
