import type * as monacoApi from 'monaco-editor';
import { createPlugin } from '../../core';
const extraLibs = new Map();

declare module 'monaco-editor' {
  namespace languages.typescript {
    function loadTypes(
      name: string,
      version: string
    ): Promise<{ [key: string]: string }>;
    function exposeGlobal(
      pkg: string,
      imported: string,
      exported: string
    ): void;
    function addGlobal(code: string): void;
  }
}

export default (
  compilerOptions: monacoApi.languages.typescript.CompilerOptions = {}
) =>
  createPlugin(
    { name: 'typescript.typings', dependencies: ['core.worker'] },
    (monaco) => {
      let disposable = monaco.worker.register({
        label: 'typings',
        // src: 'https://unpkg.com/use-monaco/dist/assets/typings.monaco.worker.js',
        src: monaco.worker.baseWorkerPath + `typings.monaco.worker.js`,
        // src: 'http://localhost:3000/_next/static/workers/typings.monaco.worker.js',
        options: {},
        providers: false,
      });
      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

      const defaultCompilerOptions = {
        allowJs: true,
        allowSyntheticDefaultImports: true,
        alwaysStrict: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        // isolatedModules: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        noEmit: true,
        resolveJsonModule: true,
        strict: true,
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        ...compilerOptions,
      };
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        defaultCompilerOptions
      );
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        defaultCompilerOptions
      );

      const addGlobal = (code: string) => {
        // const currentLib = api.languages.typescript.javascriptDefaults.getExtraLibs();
        // console.log(currentLib);
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          code,
          monaco.Uri.file('global.d.ts').toString()
        );
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
          code,
          monaco.Uri.file('global.d.ts').toString()
        );
      };

      Object.assign(monaco.languages.typescript, {
        loadTypes: async (name: string, version: string) => {
          const worker = await monaco.worker.get<{
            fetchTypings: (name: string, varsion: string) => any;
          }>('typings');
          const { typings } = await worker.fetchTypings(name, version);
          Object.keys(typings).forEach((path) => {
            let extraLib = extraLibs.get(path);
            extraLib && extraLib.dispose();
            extraLib = monaco.languages.typescript.typescriptDefaults.addExtraLib(
              typings[path],
              monaco.Uri.from({ scheme: 'file', path }).toString()
            );
            extraLib = monaco.languages.typescript.javascriptDefaults.addExtraLib(
              typings[path],
              monaco.Uri.from({ scheme: 'file', path }).toString()
            );
            extraLibs.set(path, extraLib);
          });
          return typings;
        },
        exposeGlobal: (pkg: string, imported: string, exported: string) => {
          const pkgName = pkg
            .replace('-', '')
            .replace('@', '')
            .replace('/', '');
          addGlobal(`import * as ${pkgName} from "./node_modules/${pkg}";

      declare global {
        export const ${exported}: typeof ${pkgName}.${imported}
      }`);
        },
        addGlobal: addGlobal,
      });

      return disposable;
    }
  );
