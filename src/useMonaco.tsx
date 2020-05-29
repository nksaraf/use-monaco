import { useEffect } from 'react';
import React from 'react';
import * as monacoApi from 'monaco-editor';
import addons from './monaco';
import { noop, getNextWorkerPath } from './utils';

interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

const merge = (target: { [x: string]: any }, source: { [x: string]: any }) => {
  Object.keys(source).forEach((key) => {
    if (source[key] instanceof Object)
      target[key] &&
        Object.assign(source[key], merge(target[key], source[key]));
  });
  return { ...target, ...source };
};

const makeCancelable = function <T>(
  promise: Promise<T>
): CancellablePromise<T> {
  let hasCanceled_ = false;
  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then((val) =>
      hasCanceled_ ? reject('operation is manually canceled') : resolve(val)
    );
    promise.catch((error) => reject(error));
  });
  const cancellablePromise = Object.assign(wrappedPromise, {
    cancel: () => (hasCanceled_ = true),
  });
  return cancellablePromise;
};

export class MonacoLoader {
  config: any;
  constructor() {
    this.config = {};
  }
  resolve: any;
  reject: any;
  injectScripts(script: HTMLScriptElement) {
    document.body.appendChild(script);
  }
  handleMainScriptLoad = () => {
    document.removeEventListener('monaco_init', this.handleMainScriptLoad);
    this.resolve((window as any).monaco);
  };
  createScript(src?: string) {
    const script = document.createElement('script');
    return src && (script.src = src), script;
  }
  createMonacoLoaderScript(mainScript: HTMLScriptElement) {
    const loaderScript = this.createScript(`${this.config.paths.vs}/loader.js`);
    loaderScript.onload = () => this.injectScripts(mainScript);
    loaderScript.onerror = this.reject;
    return loaderScript;
  }

  createMainScript() {
    const mainScript = this.createScript();
    mainScript.innerHTML = `
      require.config(${JSON.stringify(this.config)});
      require(['vs/editor/editor.main'], function() {
        document.dispatchEvent(new Event('monaco_init'));
      });
    `;
    mainScript.onerror = this.reject;
    return mainScript;
  }
  isInitialized = false;
  wrapperPromise = new Promise<typeof monacoApi>((res, rej) => {
    this.resolve = res;
    this.reject = rej;
  });
  init(config: any): CancellablePromise<typeof monacoApi> {
    if (!this.isInitialized) {
      //@ts-ignore
      if (window.monaco && window.monaco.editor) {
        //@ts-ignore
        return new Promise((res, rej) => res(window.monaco));
      }
      this.config = merge(this.config, config);
      document.addEventListener('monaco_init', this.handleMainScriptLoad);
      const mainScript = this.createMainScript();
      const loaderScript = this.createMonacoLoaderScript(mainScript);
      this.injectScripts(loaderScript);
    }
    this.isInitialized = true;
    return makeCancelable(this.wrapperPromise);
  }
}

export const monacoLoader = new MonacoLoader();

export const useMonaco = ({
  paths: {
    vs = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/min/vs',
  } = {},
  onLoad = noop,
  plugins = [],
}: {
  paths?: {
    vs?: string;
  };
  onLoad?: (monaco: typeof monacoApi) => (() => void) | void;
  plugins?: monacoApi.plugin.IPlugin[];
} = {}) => {
  const [isMonacoMounting, setIsMonacoMounting] = React.useState(true);
  const monacoRef = React.useRef<typeof monacoApi>();
  const cleanupRef = React.useRef<() => void>();

  useEffect(() => {
    const cancelable = monacoLoader.init({ paths: { vs } });
    cancelable
      .then((monaco) => {
        monaco = addons(monaco);
        monaco.worker.setEnvironment({
          getWorker: (label) => {
            let worker;
            if (label === 'editorWorkerService') {
              worker = getNextWorkerPath('editor');
            } else if (label === 'typescript' || label === 'javascript') {
              worker = getNextWorkerPath('ts');
            } else {
              worker = getNextWorkerPath(label);
            }

            var workerSrcBlob, workerBlobURL;
            workerSrcBlob = new Blob(
              [`importScripts("http://localhost:3000/${worker}")`],
              {
                type: 'text/javascript',
              }
            );
            workerBlobURL = window.URL.createObjectURL(workerSrcBlob);
            return new Worker(workerBlobURL);
          },

          // () => {
          //   return 'http://localhost:3000/_next/static/workers/typings.monaco.worker.js';

          //   return new Worker(
          //     `data:text/javascript;charset=utf-8,${encodeURIComponent(`
          // // self.MonacoEnvironment = {
          // //   baseUrl: 'http://www.mycdn.com/monaco-editor/min/'
          // // };
          // importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/esm/vs/language/typescript/ts.worker.js');`)}`
          //   );
          // },
        });
        var pluginDisposables = monaco.plugin.install(...plugins);
        var onLoadCleanup = onLoad?.(monaco) as any;
        cleanupRef.current = () => {
          pluginDisposables.dispose();
          if (onLoadCleanup) {
            onLoadCleanup();
          }
        };
        monacoRef.current = monaco;
        setIsMonacoMounting(false);
      })
      .catch((error) =>
        console.error(
          'An error occurred during initialization of Monaco:',
          error
        )
      );
    return () => {
      cancelable.cancel();
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    monaco: monacoRef.current,
    loading: Boolean(monacoRef.current),
  };
};
