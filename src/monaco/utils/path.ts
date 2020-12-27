
export const fixPath = (path: string) => path.startsWith('/') ? path : `/${path}`;

export const endingSlash = (path: string) => path.endsWith('/') ? path : `${path}/`;

export const noEndingSlash = (path: string) => !path.endsWith('/') ? path : path.substr(0, path.length - 1);
