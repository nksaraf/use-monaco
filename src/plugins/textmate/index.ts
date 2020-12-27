import { loadWASM } from 'onigasm';
import { Registry } from 'monaco-textmate';
import { StackElement, INITIAL } from 'monaco-textmate';
import type * as monacoApi from 'monaco-editor';
import { textMateToMonacoToken } from './tm-to-monaco-token';
import { createPlugin } from '../../monaco';

declare module 'monaco-editor' {
  namespace languages {
    // export let : {
    export let registerSyntax: (
      language: string,
      syntax?: monacoApi.plugin.textmate.SyntaxSource
    ) => Promise<void>;

    interface ILanguageExtensionPoint {
      /**
       * eg. () => import('./typescript')
       **/
      syntax?: monacoApi.plugin.textmate.SyntaxSource;
    }

    // };
  }

  namespace plugin {
    namespace textmate {
      type SyntaxSource =
        | {
            format?: 'url';
            scopeName?: string;
            url?: string;
            responseFormat?: 'json' | 'plist';
          }
        | { format?: 'json'; scopeName?: string; content?: '' };
    }
  }
}

class TokenizerState implements monacoApi.languages.IState {
  constructor(private _ruleStack: StackElement) {}

  public get ruleStack(): StackElement {
    return this._ruleStack;
  }

  public clone(): TokenizerState {
    return new TokenizerState(this._ruleStack);
  }

  public equals(other: monacoApi.languages.IState): boolean {
    if (
      !other ||
      !(other instanceof TokenizerState) ||
      other !== this ||
      other._ruleStack !== this._ruleStack
    ) {
      return false;
    }
    return true;
  }
}

const knonwSyntaxes = {
  'source.graphql': {
    format: 'url' as const,
    responseFormat: 'json' as const,
    scopeName: 'source.graphql',
    url:
      'https://raw.githubusercontent.com/codesandbox/codesandbox-client/master/standalone-packages/vscode-extensions/out/extensions/kumar-harsh.graphql-for-vscode-1.13.0/syntaxes/graphql.json',
  },
  'source.json.comments': {
    format: 'url' as const,
    scopeName: 'source.json.comments',
    responseFormat: 'json' as const,

    url:
      'https://raw.githubusercontent.com/codesandbox/codesandbox-client/master/standalone-packages/vscode-extensions/out/extensions/json/syntaxes/JSONC.tmLanguage.json',
  },
  'source.tsx': {
    format: 'url' as const,
    scopeName: 'source.tsx',
    responseFormat: 'plist' as const,
    url:
      'https://raw.githubusercontent.com/microsoft/TypeScript-TmLanguage/master/TypeScriptReact.tmLanguage',
  },
  'source.css': {
    format: 'url' as const,
    scopeName: 'source.css',
    responseFormat: 'json' as const,
    url:
      'https://raw.githubusercontent.com/codesandbox/codesandbox-client/master/standalone-packages/vscode-extensions/out/extensions/css/syntaxes/css.tmLanguage.json',
  },
  'text.html.basic': {
    format: 'url' as const,
    scopeName: 'text.html.basic',
    responseFormat: 'json' as const,
    url:
      'https://raw.githubusercontent.com/codesandbox/codesandbox-client/master/standalone-packages/vscode-extensions/out/extensions/html/syntaxes/html.tmLanguage.json',
  },
};

const knonwScopes = {
  graphql: 'source.graphql',
  json: 'source.json.comments',
  typescript: 'source.tsx',
  javascript: 'source.tsx',
  css: 'source.css',
  html: 'text.html.basic',
};

export default () =>
  createPlugin(
    {
      name: 'textmate',
      dependencies: ['core.editors'],
    },
    async (monaco) => {
      await loadWASM('https://www.unpkg.com/onigasm/lib/onigasm.wasm');

      const syntaxes: {
        [key: string]: monacoApi.plugin.textmate.SyntaxSource;
      } = {
        ...knonwSyntaxes,
      };
      // map of monaco "language id's" to TextMate scopeNames
      const grammars = {};

      const registry = new Registry({
        getGrammarDefinition: async (scopeName) => {
          const repo = syntaxes[scopeName] as any;

          if (!repo) {
            return {
              format: 'json',
              content: '{}',
            };
          }
          if (repo.format === 'url') {
            return {
              format: repo.responseFormat,
              content: await (await fetch(repo.url)).text(),
            };
          } else {
            return repo;
          }
        },
      });

      async function registerSyntax(
        language: string,
        scopeName = knonwScopes[language],
        syntax = knonwSyntaxes[scopeName]
      ) {
        syntax = syntax.format ? syntax : knonwSyntaxes[scopeName];
        syntaxes[scopeName] = syntax;
        grammars[language] = scopeName;

        const grammar = await registry.loadGrammar(scopeName);

        monaco.languages.setTokensProvider(language, {
          getInitialState: () => new TokenizerState(INITIAL),
          tokenize: (line: string, state: TokenizerState) => {
            const oldStack = state.ruleStack;
            try {
              const res = grammar.tokenizeLine(line, state.ruleStack);
              const editor = monaco.editor.getFocusedEditor();

              const tokens = {
                endState: new TokenizerState(res.ruleStack),
                tokens: res.tokens.map((token) => ({
                  ...token,
                  // TODO: At the moment, monaco-editor doesn't seem to accept array of scopes
                  scopes: editor
                    ? textMateToMonacoToken(editor, token.scopes)
                    : token.scopes.join(' '),
                })),
              };
              return tokens;
            } catch (e) {
              return {
                endState: new TokenizerState(oldStack),
                tokens: [],
              };
            }
          },
        });
      }

      monaco.languages.registerSyntax = (language, syntax) =>
        registerSyntax(language, syntax?.scopeName, syntax);

      let oldRegister = monaco.languages.register;

      monaco.languages.register = (def) => {
        if (knonwScopes[def.id] && def.loader) {
          delete def.loader;
        }

        oldRegister(def);

        if (def.id === 'json') {
          monaco.languages.json?.jsonDefaults?.setModeConfiguration({
            tokens: false,
          });
        }

        if (knonwScopes[def.id]) {
          monaco.languages.registerSyntax(def.id);
        }
      };
    }
  );
