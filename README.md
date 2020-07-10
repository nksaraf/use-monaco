# 🗒️ `use-monaco`

[![npm](https://img.shields.io/npm/v/use-monaco)](https://npm.im/use-monaco)

- Simple hooks to use [monaco-editor](https://microsoft.github.io/monaco-editor/) in any React app
- No webpack plugins or AMD loaders required while maintaining full support for monaco web-workers without build tools
- Easy API for working with web-workers.
- Headless (just hooks), so you can:
  - Render however you want (it's just a single div, style it as you wish)
  - Decide how to render loading state  (`loading` prop is returned by the [`useMonacoEditor`](#usemonacoeditor) and [`useMonaco`](#usemonaco) hooks)
  - Work with underlying monaco objects like [`monaco`](https://microsoft.github.io/monaco-editor/api/index.html) API, the [`editor`](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.istandalonecodeeditor.html) instance, and the text [`model`](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodel.html) instances
  - Use the above objects in `useEffect` hooks together to wire up custom functionality
- Inspired by [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react).
- Availabe on Pika CDN. There is a simple example of using this below, (no build tool, just copy this [html](https://use-monaco.now.sh/simple.html) anywhere and you are golden).
- Built with [pkger](https://github.com/nksaraf/pkger)
- In progress: docs about setting up language providers, example with parcel, next.js, vanilla

## Documentation

- [Example](#example)
- [Installation](#installation)
- [`monaco-editor` documentation](https://microsoft.github.io/monaco-editor/api/index.html)
- [`useMonacoEditor`](#usemonacoeditor)
  - [`useMonaco`](#usemonaco)
  - [`useEditor`](#useeditor)
  - [`useTextModel`](#usetextmodel)
- [Working with workers](#workingwithworkers)

## Example

```html
<body>
  <div id="root"></div>
  <script defer type="module">
    import {
      useMonacoEditor,
      prettier,
    } from 'https://cdn.pika.dev/use-monaco@0.0.3';
    import themes from 'https://cdn.pika.dev/use-monaco@0.0.3/themes';
    import * as React from 'https://cdn.pika.dev/react';
    import ReactDOM from 'https://cdn.pika.dev/react-dom';
    import htm from 'https://cdn.pika.dev/htm';
    const html = htm.bind(React.createElement);

    let Editor = () => {
      const { containerRef, monaco, model, loading } = useMonacoEditor({
        plugins: [prettier(['graphql'])],
        themes,
        theme: 'github',
        path: 'model.graphql',
        defaultValue: ['type Query {}'].join('\n'),
      });

      return html`<div
        ref=${containerRef}
        style=${{ height: 800, width: 600 }}
      />`;
    };

    ReactDOM.render(html`<${Editor} />`, document.getElementById('root'));
  </script>
</body>
```

## Installation

You can get `use-monaco` from `yarn` or `npm`:

```bash
yarn add use-monaco

#or
npm install use-monaco
```

or use it directly from a CDN like Pika or unpkg in browsers with ESM support:

```typescript
import { useMonacoEditor } from 'https://cdn.pika.dev/use-monaco';
import { initialize } from 'https://cdn.pika.dev/use-monaco/worker';

import { useMonacoEditor } from 'https://unpkg.com/use-monaco';
```

## `useMonacoEditor`

Single hook to get all [`monaco-editor` documentation](https://microsoft.github.io/monaco-editor/api/index.html) functionality for one editor instance that wires up the three underlying hooks [`useMonaco`](#usemonaco), [`useTextModel`](#usetextmodel) and `useEditor`. If you only need a single editor, `useMonacoEditor` will work fine for you as it allows you to send options for all underlying hooks. For multiple editors, you would need to use some of the other hooks like [`useTextModel`](#usetextmodel) and [`useEditor`](#useeditor). Most props are optional, coming with sensible defaults. `useMonacoEditor` accepts the props for all these hooks and returns everything they return.

```typescript
function useMonacoEditor(options: {
 ...useMonacoOptions, // see below
 ...useTextModelOptions,
 ...useEditorOptions
}): {
  // assign to a div to render editor
  containerRef: React.MutableRefObject<HTMLDivElement>;
  editor: monaco.editor.IStandaloneCodeEditor;
  loading: boolean;
  monaco: typeof monaco;
  model: monaco.editor.ITextModel;
};
```

- ### `useMonaco`
  - Provides you with [`monaco-editor`](https://microsoft.github.io/monaco-editor/api/index.html) API namespace to work with, includes [`monaco.languages`](https://microsoft.github.io/monaco-editor/api/modules/monaco.languages.html), [`monaco.editor`](https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html)
  - Extended `monaco.worker` API with for easy support for adding custom workers and languages
  - Added `monaco.plugins` API to enable functionality by simply registering plugins 
  - Plugins for `prettier`, `typings`, `graphql` available out-of-the-box (backed by web-workers and completely opt-in)
  - Dedupes the request for the loading `monaco-editor` from the CDN across multiple calls

```typescript
function useMonaco(options: {
  // plugins to enable, eg. [prettier(["graphql", "typescript"]), typings(), ...]
  plugins?: monaco.plugin.IPlugin[];
  paths?: {
    // Custom CDN link for monaco-editor
    vs?: string;
  };
  // A collection of themes that can be selected from
  themes?: { [key: string]: monaco.editor.IStandaloneThemeData };
  // Function will fire when monaco loads from the CDN (this is where you can load custom workers and languages)
  onLoad?: (monaco: typeof monaco) => (() => void) | void;
  // Function will fire when the theme is changed by any editor
  onThemeChange?: (newTheme: string, monaco: typeof monaco) => void;
}): {
  loading: boolean;
  monaco: typeof monaco;
};
```

- ### `useEditor`
  - Creates a monaco code editor which provides a `containerRef` that you will need to render as a `div` in your React app.
  - Uses models to show content.
  - Can be used multiple times with multiple models to get a bunch of editors
  - Controlled and uncontrolled based on how you control the model
  - Returns editor instance so that you can play with it

```typescript
function useEditor(options: {
  // must provide monaco instance from useMonaco hook
  monaco?: typeof monaco;

  // model to assign to editor (get this from useTextModel hook)
  model?: monaco.editor.ITextModel;

  // theme for the editor (can be a custom one or name of theme providede to useMonaco hook) [theme will change across editors]
  theme?: string | monaco.editor.IStandaloneThemeData;

  // Function to wire when the value of the model changes
  onChange?: (
    newValue: string,
    editor: monaco.editor.IStandaloneCodeEditor,
    event: monaco.editor.IModelContentChangedEvent,
    monaco: typeof monaco
  ) => void;

  // Function is fired before editor is created (can return options to be provided to the editor)
  editorWillMount?: (
    monaco: typeof monaco
  ) => monaco.editor.IEditorOptions | void;

  // Function is fired after editor is created, return disposables that will be cleared on unmount
  editorDidMount?: (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof monaco
  ) => monaco.IDisposable[] | Promise<void> | void;

  // Override internal monaco services for the editor
  overrideServices?:
    | monaco.editor.IEditorOverrideServices
    | ((monaco: typeof monaco) => monaco.editor.IEditorOverrideServices);
  options?: monaco.editor.IEditorOptions;
}): {
  // assign this ref to a div with some styling and you are good to go
  containerRef: React.MutableRefObject<HTMLDivElement>;
  editor: monaco.editor.IStandaloneCodeEditor;
};
```

- ### `useTextModel`
  - Create models to be viewed on `monaco` editors
  - Create more that one for different files to show across editors
  - Basically a super simple file system backed by monaco models
  - Use path to select model

```typescript
function useTextModel(options: {
  // must provide monaco instance from useMonaco hook
  monaco?: typeof monaco;
  // just the initial value for uncontrolled model
  defaultValue?: string;
  // or value for controlled mode
  value?: string;
  // or dictionary of paths to the content of the files (path is used to determine value of the file)
  files?: { [key: string]: string };

  // path of the model you want to select, a new model is created if one doesn't exist
  path?: string;
  // language of the model (can normally be interpreted from path extension)
  language?: string;
  // create models for all files eagerly
  syncAllFiles?: boolean;
}): monaco.editor.ITextModel;
```

Example of using the hooks separately,

```html
<body>
  <div id="root"></div>
  <script defer type="module">
    import {
      useMonaco,
      useEditor,
      useTextModel,
      prettier,
    } from 'https://cdn.pika.dev/use-monaco@0.0.3';
    import themes from 'https://cdn.pika.dev/use-monaco@0.0.3/themes';
    import * as React from 'https://cdn.pika.dev/react';
    import ReactDOM from 'https://cdn.pika.dev/react-dom';
    import htm from 'https://cdn.pika.dev/htm';
    const html = htm.bind(React.createElement);

    let Editor = () => {
      const { monaco, loading } = useMonaco({
        plugins: [prettier(['graphql'])],
        themes,
        theme: 'github',
      });

      const model = useTextModel({
        path: 'model.graphql',
        defaultValue: ['type Query {}'].join('\n'),
      });
      const { containerRef } = useEditor({ monaco, model });

      return html`<div
        ref=${containerRef}
        style=${{ height: 800, width: 600 }}
      />`;
    };

    ReactDOM.render(html`<${Editor} />`, document.getElementById('root'));
  </script>
</body>
```

## Working with workers

`monaco-editor` is already using a bunch of workers for languages like typescript, html, css as well some editor services. You can add custom workers to offload work for your custom functionality from the main thread. This can ensure that the UI  doesn't lag or your typing experience is not harmed by these computations like linting, etc. happening.  You can register workers in your components using the `monaco.worker` api available on the main thread. Workers are also used to provide core language functionality to monaco by registering providers to things like hover, auto-complete, validation, formatting, etc. There is an easy API to enable this as well provided by `use-monaco`.

```typescript
// Register the worker in onLoad or in an effect (remember to cleanup)
monaco.worker.register({
  label: 'babel',
  src: () =>
    new Worker('./path.to.worker.js', {
      // to use esm syntax in worker
      type: 'module',
    }),
});
```

You worker needs to follow a simple interface to work with `use-monaco`.

```typescript
import { initialize, BaseWorker } from 'use-monaco/worker';
// or https://unpkg.com/use-monaco/dist/esm/worker.js to load from CDN

// Extend BaseWorker to get the ability to use the monaco models on the worker side.
class BabelWorker extends BaseWorker {
  transpile(path) {
    const text = this.getText(path);
    // do some hard work;
    const transpiled = Babel.transpile(text);
    return transpiled;
  }
}

// call initialize to setup the worker to communicate with monaco
initialize('babel', BabelWorker);
```

And then you can use the worker on the main thread by retreiving the worker using its label and syncing the models you would need on the backend. You can then use the functions that were exposed by the worker as async functions.

```typescript
// You get a proxy to the registered worker with the contents
// of the files that you mention here synced. The worker has to extend a simple interface
const worker = await monaco.worker.get('babel', 'model1.ts', 'model2.ts');
const something = await worker.transpile('model.ts');
```


