import * as monacoApi from 'monaco-editor';
import { BASE_WORKER_PATH } from '../monaco/worker';
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

export const typings = (
  compilerOptions: monacoApi.languages.typescript.CompilerOptions = {}
) => (api: typeof monacoApi) => {
  let disposable = api.worker.register({
    label: 'typings',
    // src: 'https://unpkg.com/use-monaco/dist/assets/typings.monaco.worker.js',
    src: `${BASE_WORKER_PATH}typings.monaco.worker.js`,
    // src: 'http://localhost:3000/_next/static/workers/typings.monaco.worker.js',
    options: {},
    providers: false,
  });
  api.languages.typescript.typescriptDefaults.setEagerModelSync(true);
  api.languages.typescript.javascriptDefaults.setEagerModelSync(true);

  const defaultCompilerOptions = {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    alwaysStrict: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    // isolatedModules: true,
    jsx: api.languages.typescript.JsxEmit.React,
    module: api.languages.typescript.ModuleKind.ESNext,
    moduleResolution: api.languages.typescript.ModuleResolutionKind.NodeJs,
    noEmit: true,
    resolveJsonModule: true,
    strict: true,
    target: api.languages.typescript.ScriptTarget.ESNext,
    ...compilerOptions,
  };
  api.languages.typescript.typescriptDefaults.setCompilerOptions(
    defaultCompilerOptions
  );
  api.languages.typescript.typescriptDefaults.setCompilerOptions(
    defaultCompilerOptions
  );

  const addGlobal = (code: string) => {
    // const currentLib = api.languages.typescript.javascriptDefaults.getExtraLibs();
    // console.log(currentLib);
    api.languages.typescript.typescriptDefaults.addExtraLib(
      code,
      api.Uri.file('global.d.ts').toString()
    );
    api.languages.typescript.javascriptDefaults.addExtraLib(
      code,
      api.Uri.file('global.d.ts').toString()
    );
  };

  Object.assign(api.languages.typescript, {
    loadTypes: async (name: string, version: string) => {
      const worker = await api.worker.get<{
        fetchTypings: (name: string, varsion: string) => any;
      }>('typings');
      const { typings } = await worker.fetchTypings(name, version);
      Object.keys(typings).forEach((path) => {
        let extraLib = extraLibs.get(path);
        extraLib && extraLib.dispose();
        extraLib = api.languages.typescript.typescriptDefaults.addExtraLib(
          typings[path],
          api.Uri.from({ scheme: 'file', path }).toString()
        );
        extraLib = api.languages.typescript.javascriptDefaults.addExtraLib(
          typings[path],
          api.Uri.from({ scheme: 'file', path }).toString()
        );
        extraLibs.set(path, extraLib);
      });
      return typings;
    },
    exposeGlobal: (pkg: string, imported: string, exported: string) => {
      const pkgName = pkg.replace('-', '').replace('@', '').replace('/', '');
      addGlobal(`import * as ${pkgName} from "./node_modules/${pkg}";

      declare global {
        export const ${exported}: typeof ${pkgName}.${imported}
      }`);
    },
    addGlobal: addGlobal,
  });

  return disposable;
};
