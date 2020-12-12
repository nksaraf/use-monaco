import '../src/plugins/typings/typings.monaco.worker';

import '../src/plugins/graphql/graphql.monaco.worker';
import '../src/plugins/prettier/prettier.monaco.worker';

import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(import('react-monaco-editor'), { ssr: false });

MonacoEditor;
