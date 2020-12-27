module.exports = {
  inputFiles: [
    './src',
    './node_modules/monaco-editor/esm/vs/editor/editor.api.d.ts',
  ],
  mode: 'modules',
  out: 'doc',
  json: 'typedoc.reflections.json',
  theme: 'minimal',
  includeDeclarations: true,
  // excludeExternals: false,
};
