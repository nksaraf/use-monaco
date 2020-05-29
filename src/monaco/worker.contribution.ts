import * as monacoApi from 'monaco-editor';

declare module 'monaco-editor' {
  namespace worker {
    interface IWorkerAccessor<TWorker> {
      (...uris: monacoApi.Uri[]): Promise<TWorker>;
    }

    interface IWorkerConfig<TOptions> {
      label?: string;
      languageId?: string;
      src?: string;
      // to be passed on to the worker
      options?: TOptions;
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

    function register<TOptions>(
      config: worker.IWorkerConfig<TOptions>
    ): monacoApi.IDisposable;

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

    function setEnvironment(environment?: {
      baseUrl?: string;
      getWorkerUrl?: (label: string) => string | undefined;
      getWorker?: (label: string) => Worker | undefined;
      workerLoader?: string;
    }): void;

    const environment: any;

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

export {};
