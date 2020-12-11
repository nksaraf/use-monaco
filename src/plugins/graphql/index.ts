export const graphql = ({ uri }) => (monaco) => {
  return monaco.worker.register({
    label: 'graphql',
    languageId: 'graphql',
    options: {
      languageConfig: {
        schemaConfig: {
          uri,
        },
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
