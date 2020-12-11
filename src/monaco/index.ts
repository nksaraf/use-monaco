import type * as api from 'monaco-editor';
import withPlugins from './plugin-api';
import { CancellablePromise, monacoLoader } from './loader';

export interface Monaco {
  monaco: typeof api | null;
}

export type monacoApi = typeof api;

export * from './loader';
export * from './plugin-api';
export * from './utils';

export default function loadMonaco(
  path = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs',
  plugins: api.plugin.IPlugin[] = []
): CancellablePromise<monacoApi> {
  const cancelable = monacoLoader.init({ paths: { vs: path } });
  let disposable: api.IDisposable;
  const promise: CancellablePromise<monacoApi> = cancelable
    .then((monaco) => {
      monaco = withPlugins(monaco);
      disposable = monaco.plugin.install(...plugins);
      return monaco;
    })
    .catch((error) =>
      console.error('An error occurred during initialization of Monaco:', error)
    ) as any;

  promise.cancel = () => {
    cancelable.cancel();
    disposable.dispose();
  };
  return promise;
}
