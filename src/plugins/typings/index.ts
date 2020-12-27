import type * as monacoApi from 'monaco-editor';
import { createPlugin } from '../../monaco';

declare module 'monaco-editor' {
  namespace languages.typescript {
    function loadTypes(
      name: string,
      version: string
    ): Promise<{ [key: string]: string }>;
    // function exposeGlobalFromPackage(
    //   pkg: string,
    //   imported: string,
    //   exported: string
    // ): void;
    function exposeGlobal(imports: string, exports: string): void;
    // function addGlobal(code: string): void;
  }
}

export default (
  compilerOptions: monacoApi.languages.typescript.CompilerOptions = {}
) =>
  createPlugin(
    {
      name: 'typescript.typings',
      dependencies: ['core.workers', 'language.typescript'],
    },
    (monaco) => {
      const extraLibs = new Map();

      if (!monaco.languages.typescript) {
        console.warn(
          `Couldn't install typescript.typings since the typescript worker is not registered`
        );
        return;
      }

      let disposable = monaco.worker.register({
        label: 'typings',
        src: monaco.loader.workersPath + `typings.monaco.worker.js`,
        options: {},
        providers: false,
      });

      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

      const defaultCompilerOptions = {
        allowJs: true,
        allowSyntheticDefaultImports: true,
        alwaysStrict: true,
        noLib: false,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        // isolatedModules: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        noEmit: true,
        lib: ['dom', 'dom.iterable', 'esnext'],
        resolveJsonModule: true,
        strict: false,
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        ...compilerOptions,
      };

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        defaultCompilerOptions
      );
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        defaultCompilerOptions
      );

      let _imports = [
        `// stub
      import * as useMonaco from 'use-monaco'`,
      ];

      let _globalExports = [];

      const resetGlobal = () => {
        const code = `${_imports.join('\n')}\n

          declare global {
            ${_globalExports.join('\n')}
          }`;

        console.log('[typings] setting global.d.ts', { code });

        let extraLib = extraLibs.get('global.d.ts');

        extraLib && extraLib.dispose();

        // const currentLib = api.languages.typescript.javascriptDefaults.getExtraLibs();
        // console.log(currentLib);
        let lib1 = monaco.languages.typescript.typescriptDefaults.addExtraLib(
          code,
          'file:///global.d.ts'
        );

        let lib2 = monaco.languages.typescript.javascriptDefaults.addExtraLib(
          code,
          'file:///global.d.ts'
        );

        extraLibs.set('global.d.ts', {
          dispose: () => {
            lib1.dispose();
            lib2.dispose();
          },
        });
      };

      Object.assign(monaco.languages.typescript, {
        loadTypes: async (name: string, version: string) => {
          const worker = await monaco.worker.getWorker<{
            fetchTypings: (name: string, varsion: string) => any;
          }>('typings');

          const { typings } = await worker.fetchTypings(name, version);
          Object.keys(typings).forEach((path) => {
            let extraLib = extraLibs.get(path);
            extraLib && extraLib.dispose();
            let extraLib1 = monaco.languages.typescript.typescriptDefaults.addExtraLib(
              typings[path],
              'file:///' + path
            );

            let extraLib2 = monaco.languages.typescript.javascriptDefaults.addExtraLib(
              typings[path],
              'file:///' + path
            );

            extraLibs.set(path, {
              dispose: () => {
                extraLib1.dispose();
                extraLib2.dispose();
              },
            });
          });
          return typings;
        },

        // exposeGlobalFromPackage: (
        //   pkg: string,
        //   imported: string,
        //   exported: string
        // ) => {
        //   const pkgName = pkg
        //     .replace('-', '')
        //     .replace('@', '')
        //     .replace('/', '');

        //   console.log(
        //     `[typings] exposing global: ${imported} from ${pkg} as ${exported}`
        //   );

        //    if (!_imports.find(i => i === `import * as ${pkgName} from "${pkg}";`)) {
        //       _imports.push(`import * as ${pkgName} from "${pkg}";`);
        //    };

        //   _globalExports.push(
        //     `export const ${exported}: typeof ${pkgName}.${imported}`
        //   );

        //   resetGlobal();
        // },

        exposeGlobal: (imports: string, exportStmts: string) => {
          _imports = [..._imports, imports];
          _globalExports = [..._globalExports, exportStmts];
          resetGlobal();
        },
        // addGlobalFromPackage: addGlobal,
      });

      resetGlobal();

      return disposable;
    }
  );
