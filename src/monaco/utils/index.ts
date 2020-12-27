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

export * from './strip-comments';
export * from './path';
export * from './disposables';
export { default as version } from './version';

export function noop<T>(): T {
  return undefined as any;
}
