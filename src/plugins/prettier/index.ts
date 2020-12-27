import type * as monacoApi from 'monaco-editor';
import { createPlugin, asDisposable } from '../../monaco';

const knownParsers: { [key: string]: keyof typeof knownPlugins } = {
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

const knownPlugins = {
  babel: ['parser-babel'],
  'babel-ts': ['parser-babel'],
  markdown: ['parser-markdown'],
  graphql: ['parser-graphql'],
  mdx: ['parser-markdown'],
  html: ['parser-html'],
  angular: ['parser-html'],
  vue: ['parser-html'],
  json: ['parser-babel'],
  css: [''],
};

declare module 'monaco-editor' {
  namespace plugin {
    export let prettier: {
      enable: (languageId: string, options?: any) => monacoApi.IDisposable;
    };
  }
}

export default (
  // languages: (
  //   | keyof typeof knownParsers
  //   | { [key: string]: keyof typeof knownPlugins }
  // )[] = Object.keys(knownParsers),
  prettierOptions: any = {},
  { workerSrc }: { workerSrc?: string | (() => Worker) } = {}
) =>
  createPlugin(
    {
      name: 'prettier',
      dependencies: ['core.workers'],
    },
    (monaco) => {
      const workerPath =
        workerSrc ?? monaco.loader.workersPath + 'prettier.monaco.worker.js';

      monaco.plugin.prettier = {
        enable: (
          languageId,
          {
            parser = knownParsers[languageId],
            plugins = knownPlugins[parser],
            ...options
          } = prettierOptions
        ) => {
          return monaco.worker.register({
            languageId: languageId,
            label: 'prettier',
            src: workerPath,
            providers: {
              documentFormattingEdit: true,
            },
            options: {
              workerSrc: workerPath,
              parser,
              plugins,
              ...options,
            },
          });
        },
      };

      let oldRegister = monaco.languages.register;

      monaco.languages.register = (def) => {
        oldRegister(def);

        if (knownParsers[def.id]) {
          monaco.plugin.prettier.enable(def.id, prettierOptions);
        }

        if (def.id === 'html') {
          // monaco.languages.html.htmlDefaults.
        }
      };
    }
  );
