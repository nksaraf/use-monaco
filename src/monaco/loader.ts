import type * as monacoApi from 'monaco-editor';
import { noEndingSlash } from './utils';

export interface CancellablePromise<T> extends Promise<T> {
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
    const loaderScript = this.createScript(
      `${noEndingSlash(this.config.paths.vs)}/loader.js`
    );
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
