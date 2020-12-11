import { LanguageServiceAPI } from 'monaco-graphql/dist/api';
import { ICreateData } from 'monaco-graphql/dist/typings';

export const graphql = (
  config: ICreateData['languageConfig']['schemaConfig']
) => (monaco) => {
  return monaco.worker.register({
    label: 'graphql',
    languageId: 'graphql',
    options: {
      languageConfig: {
        schemaConfig: config,
      },
    },
    src: monaco.worker.baseWorkerPath + 'graphql.monaco.worker.js',
    providers: {
      hover: true,
      documentFormattingEdit: true,
      completionItem: true,
      diagnostics: true,
    },
  });
};
