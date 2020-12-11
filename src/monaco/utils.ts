import type * as monacoApi from 'monaco-editor';

export function asDisposable(
  disposables: monacoApi.IDisposable[] | monacoApi.IDisposable | undefined
): monacoApi.IDisposable {
  return {
    dispose: () =>
      Array.isArray(disposables)
        ? disposeAll(disposables)
        : disposables?.dispose?.(),
  };
}

export function disposeAll(disposables: monacoApi.IDisposable[]) {
  while (disposables.length) {
    disposables.pop()?.dispose();
  }
}

export function processSize(size: string | number) {
  size = String(size);
  return !/^\d+$/.test(size) ? size : `${size}px`;
}

export function processDimensions(
  width: string | number,
  height: string | number
) {
  const fixedWidth = processSize(width);
  const fixedHeight = processSize(height);
  return {
    width: fixedWidth,
    height: fixedHeight,
  };
}

export const fixPath = (path: string) =>
  path.startsWith('/') ? path : `/${path}`;

export const endingSlash = (path: string) =>
  path.endsWith('/') ? path : `${path}/`;

export const noEndingSlash = (path: string) =>
  !path.endsWith('/') ? path : path.substr(0, path.length - 1);

export function noop<T>(): T {
  return undefined as any;
}
