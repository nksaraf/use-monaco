import type * as monaco from 'monaco-editor';

export function asDisposable(
  disposables: monaco.IDisposable[]
): monaco.IDisposable {
  return { dispose: () => disposeAll(disposables) };
}

export function disposeAll(disposables: monaco.IDisposable[]) {
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

export const getNextWorkerPath = (label: string) => {
  return `_next/static/workers/${label}.monaco.worker.js`;
};

export const fixPath = (path: string) =>
  path.startsWith('/') ? path : `/${path}`;

export function noop<T>(): T {
  return undefined as any;
}
