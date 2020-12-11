import type * as monacoApi from 'monaco-editor';
import { createPlugin, asDisposable } from '../../monaco';

const parsers: { [key: string]: keyof typeof plugins } = {
  javascript: 'babel',
  typescript: 'babel-ts',
  markdown: 'markdown',
  graphql: 'graphql',
  json: 'json',
  mdx: 'mdx',
  html: 'html',
  angular: 'angular',
  vue: 'vue',
};

const plugins = {
  babel: ['parser-babel'],
  'babel-ts': ['parser-babel'],
  markdown: ['parser-markdown'],
  graphql: ['parser-graphql'],
  mdx: ['parser-markdown'],
  html: ['parser-html'],
  angular: ['parser-html'],
  vue: ['parser-html'],
  json: ['parser-babel'],
};

export default (
  languages: (
    | keyof typeof parsers
    | { [key: string]: keyof typeof plugins }
  )[] = [],
  options: any = {},
  { workerSrc }: { workerSrc?: string | (() => Worker) } = {}
) =>
  createPlugin(
    {
      name: 'prettier',
      dependencies: ['core.worker'],
    },
    (monaco) => {
      const workerPath =
        workerSrc ?? monaco.worker.baseWorkerPath + 'prettier.monaco.worker.js';
      let disposables: monacoApi.IDisposable[] = [];

      disposables.push(
        monaco.editor.onCreatedEditor(
          (editor: monacoApi.editor.IStandaloneCodeEditor) =>
            editor.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
              () => {
                editor?.trigger('ctrl-s', 'editor.action.formatDocument', null);
              }
            )
        )
      );

      languages.forEach((langauge) => {
        if (typeof langauge === 'string') {
          disposables.push(
            monaco.worker.register({
              languageId: langauge,
              label: 'prettier',
              src: workerPath,
              providers: {
                documentFormattingEdit: true,
              },
              options: {
                parser: parsers[langauge],
                plugins: plugins[parsers[langauge]],
                ...options,
                // workerSrc: workerPath,
              },
            })
          );
        } else if (typeof langauge === 'object') {
          Object.keys(langauge).forEach((languageId) => {
            disposables.push(
              monaco.worker.register({
                languageId: languageId,
                label: 'prettier',
                src: workerPath,
                providers: {
                  documentFormattingEdit: true,
                },
                options: {
                  parser: langauge[languageId],
                  plugins: plugins[langauge[languageId]],
                  workerSrc: workerPath,
                  ...options,
                },
              })
            );
          });
        }
      });

      return asDisposable(disposables);
    }
  );
