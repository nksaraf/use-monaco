import React from 'react';
import { AppProps } from 'next/app';
import '../build/workers/worker-build';

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
