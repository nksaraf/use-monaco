import React from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(import('react-monaco-editor'), { ssr: false });

export default () => {
  return (
    <div>
      <MonacoEditor height={600} width={600} />
    </div>
  );
};
