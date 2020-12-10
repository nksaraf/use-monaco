import React from 'react';
import dynamic from 'next/dynamic';
import '../src/plugins/graphql/graphql.monaco.worker';
import '../src/plugins/prettier/prettier.monaco.worker';
import '../src/plugins/typings/typings.monaco.worker';
const MonacoEditor = dynamic(import('react-monaco-editor'), { ssr: false });

const header =
  process.env.NODE_ENV === 'production'
    ? 'https://dev-to-cms.now.sh'
    : 'http://localhost:3000';

export default () => {
  return (
    <div>
      <MonacoEditor height={600} width={600} />
    </div>
  );
};
