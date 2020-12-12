import type * as monacoApi from 'monaco-editor';
import { WorkerClient } from './worker-client';
import { endingSlash, createPlugin, noop } from '../../core';

interface Environment {
  baseUrl?: string;
  getWorkerUrl?: (label: string) => string | undefined;
  getWorker?: (label: string) => Worker | undefined;
}

declare module 'monaco-editor' {
  namespace worker {
    interface IWorkerAccessor<TWorker> {
      (...uris: monacoApi.Uri[]): Promise<TWorker>;
    }

    interface IWorkerConfig<TOptions> {
      label?: string;
      languageId?: string;
      src?: string | (() => Worker);
      // to be passed on to the worker
      options?: TOptions;
      timeoutDelay?: number;
      /* if boolean, all providers registered/not-registered,
            if object, more control over which specific providers are registered */
      providers?: boolean | ILangProvidersOptions;
    }

    interface IWorkerRegistrationOptions<T> extends IWorkerConfig<T> {
      onRegister?: (
        // client: WorkerClient<T, any>,
        client: any,
        monaco: typeof monacoApi
      ) => void;
    }

    export const baseWorkerPath: string;

    function register<TOptions>(
      config: worker.IWorkerConfig<TOptions>
    ): monacoApi.IDisposable;

    function setup(basePath?: string): void;

    function getClient<TOptions, TWorker extends any>(label: string): any;
    // ): WorkerClient<TOptions, TWorker>;

    // provided in MonacoEditor.tsx
    function setEditor(editor: monacoApi.editor.ICodeEditor): void;
    function getLanguage<TWorker extends any>(
      ...uri: monacoApi.Uri[]
    ): Promise<TWorker>;
    function get<TWorker extends any>(
      label: string,
      ...uri: monacoApi.Uri[]
    ): Promise<TWorker>;

    function setEnvironment(environment?: Environment): void;

    function updateConfig<TOptions>(
      label: string,
      config?: Omit<
        monacoApi.worker.IWorkerConfig<TOptions>,
        'languageId' | 'label'
      >
    ): void;

    function updateOptions<TOptions>(label: string, options?: TOptions): void;
  }
}

export default ({
  path: baseWorkerPath = 'https://unpkg.com/use-monaco/dist/workers/',
}: {
  path: string;
}) =>
  createPlugin(
    { name: 'core.worker', dependencies: ['core.editor'] },
    (monaco) => {
      console.log(baseWorkerPath);
      const javascriptClient: WorkerClient<
        monacoApi.languages.typescript.LanguageServiceDefaults,
        monacoApi.languages.typescript.TypeScriptWorker
      > = {
        getSyncedWorker: async (
          ...resources: monacoApi.Uri[]
        ): Promise<monacoApi.languages.typescript.TypeScriptWorker> => {
          const getWorker = await monaco.languages.typescript.getJavaScriptWorker();
          return await getWorker(...resources);
        },
        src: baseWorkerPath + 'ts.monaco.worker.js',
        // @ts-ignore
        config: monaco.languages.typescript.javascriptDefaults,
      };
      const typescriptClient: WorkerClient<
        monacoApi.languages.typescript.LanguageServiceDefaults,
        monacoApi.languages.typescript.TypeScriptWorker
      > = {
        getSyncedWorker: async (
          ...resources: monacoApi.Uri[]
        ): Promise<monacoApi.languages.typescript.TypeScriptWorker> => {
          const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
          return await getWorker(...resources);
        },
        src: baseWorkerPath + 'ts.monaco.worker.js',
        // @ts-ignore
        config: monaco.languages.typescript.typescriptDefaults,
      };

      const defaultClients = (basePath) => ({
        typescript: {
          ...typescriptClient,
          src: basePath + 'ts.monaco.worker.js',
        },
        javascript: {
          ...javascriptClient,
          src: basePath + 'ts.monaco.worker.js',
        },
        editorWorkerService: {
          src: basePath + 'editor.monaco.worker.js',
        },
        html: {
          src: basePath + 'html.monaco.worker.js',
        },
        css: {
          src: basePath + 'css.monaco.worker.js',
        },
        json: {
          src: basePath + 'json.monaco.worker.js',
        },
      });

      class MonacoWorkerApi {
        baseWorkerPath: string;
        setup(basePath: string = baseWorkerPath) {
          this.baseWorkerPath = endingSlash(basePath);
          this.workerClients = {
            ...this.workerClients,
            ...defaultClients(this.baseWorkerPath),
          } as any;
          this.setEnvironment({
            getWorker: (label) => {
              const workerSrc = this.workerClients[label].src;
              console.log(`[monaco] loading worker: ${label}`);
              if (typeof workerSrc === 'string') {
                var workerBlobURL = createBlobURL(
                  `importScripts("${workerSrc}")`
                );
                return new Worker(workerBlobURL, {
                  name: label,
                });
              } else {
                return workerSrc();
              }
            },
          });
        }
        workerClients: {
          [key: string]: WorkerClient<any, any>;
        } = defaultClients as any;
        environment: Environment;
        _workers: { [key: string]: WorkerClient<any, any> } = {};
        _editor?: monacoApi.editor.ICodeEditor;
        _registerWorker<TOptions>({
          onRegister,
          ...config
        }: monacoApi.worker.IWorkerRegistrationOptions<TOptions>) {
          ``;
          console.log(`[monaco] registering worker: ${config.label}`, config);
          const client = new WorkerClient(config, monaco);
          this.workerClients[config.label ?? ''] = client;
          if (onRegister) {
            onRegister(client, monaco);
          }
          return client;
        }
        register<TOptions>(
          config: monacoApi.worker.IWorkerRegistrationOptions<TOptions>
        ) {
          // if (config.languageId) {
          //   return monaco.languages.onLanguage(config.languageId, () => {
          //     return this._registerWorker(config);
          //   });
          // } else {
          return this._registerWorker(config);
          // }
        }
        getClient<TOptions, TWorker>(label: string) {
          if (!this.workerClients[label]) {
            throw new Error(`Worker ${label} not registered!`);
          }
          return this.workerClients[label] as WorkerClient<TOptions, TWorker>;
        }
        setEditor(editor: monacoApi.editor.ICodeEditor) {
          this._editor = editor;
        }
        async getLanguage<TWorker>(...uri: monacoApi.Uri[]) {
          let language;
          if (uri.length === 0 && this._editor) {
            const model = this._editor?.getModel();
            if (model) {
              language = model.getModeId();
              uri.push(model.uri);
            }
          } else {
            const model = monaco.editor.getModel(uri[0]);
            if (model) {
              language = model.getModeId();
            }
          }
          if (!language) {
            return null;
          }
          return await this.get<TWorker>(language, ...uri);
        }
        async get<TWorker>(label: string, ...uri: monacoApi.Uri[]) {
          if (uri.length === 0 && this._editor) {
            const editorUri = this._editor.getModel()?.uri;
            editorUri && uri.push(editorUri);
          }
          return this.getClient<any, TWorker>(label).getSyncedWorker(...uri);
        }
        setConfig<TOptions>(
          label: string,
          config: monacoApi.worker.IWorkerConfig<TOptions>
        ) {
          this.getClient<TOptions, any>(label).config.setConfig(config);
        }
        updateOptions<TOptions>(label: string, options: TOptions) {
          this.getClient<TOptions, any>(label).config.setOptions(options);
        }
        setEnvironment({
          getWorkerUrl = noop,
          getWorker = noop,
          baseUrl = undefined,
        }: Environment) {
          if (baseUrl || getWorker || getWorkerUrl) {
            const getWorkerPath = (_moduleId: string, label: string) => {
              const url = getWorkerUrl?.(label);
              if (url) return url;
              return undefined;
            };
            // @ts-ignore
            window.MonacoEnvironment = {
              // baseUrl: baseUrl,
              getWorker: (_moduleId: string, label: string) => {
                const worker = getWorker?.(label);
                if (worker) {
                  return worker;
                }
                const url = getWorkerPath(_moduleId, label);
                if (url) {
                  return new Worker(url, {
                    name: label,
                  });
                }
                return null;
              },
            };
          }
          this.environment = { baseUrl, getWorker, getWorkerUrl };
        }
      }
      Object.assign(monaco, {
        worker: new MonacoWorkerApi(),
      });

      monaco.worker.setup(baseWorkerPath);
      return monaco.editor.onCreatedEditor((editor) => {
        monaco.worker.setEditor(editor);
      });
    }
  );

function createBlobURL(workerSrc: string) {
  var workerSrcBlob, workerBlobURL;
  workerSrcBlob = new Blob([workerSrc], {
    type: 'text/javascript',
  });
  workerBlobURL = window.URL.createObjectURL(workerSrcBlob);
  return workerBlobURL;
}
