# 🗒️ use-monaco

A few simple hooks to use [monaco-editor](https://microsoft.github.io/monaco-editor/) in any React app without webpack plugins or AMD loaders (in esm) without losing support for web-workers. This library is inspired by [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react). `use-monaco` is headless so you have render the element yourself (it's just a single div without space for an editor). But this allows us to give you easy access to the underlying monaco objects like `monaco`, the `editor` instance, and the `model` instances. You can use these in effects them to wire up custom functionality. Here is a simple example of using it with support of the pika cdn, (no build tool here, just copy this [html](https://use-monaco.now.sh/simple.html) anywhere and you are golden).

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

## useMonacoEditor

Single hook to get all `monaco` functionality for one editor that wires up the three underlying hooks `useMonaco`, `useMonacoModel` and `useEditor`. If you only need a single editor, `useMonacoEditor` is fine for you. For multiple editors, you would need to use some of the other hooks like `useMonacoModel` and `useEditor`. Most props are optional with sensible defaults. `useMonacoEditor` accepts the props for all these hooks and returns everything they return. 

```typescript
function useMonacoEditor(options: {
 ...useMonacoOptions, // see below
 ...useMonacoModelOptions,
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

### useMonaco

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

- Provides you with `monaco` namespace to work with
- Extended API for easy support for adding custom workers and languages
- Optinal plugins like `prettier`, `typings`, `graphql` that are backed by web-workers
- Dedupes the request for the `monaco-editor` from the CDN across multiple calls

### useMonacoModel

```typescript
function useMonacoModel(options: {
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

- Create models to be viewed on `monaco` editors
- Create more that one for different files to show across editors
- Basically a super simple file system backed by monaco models
- Use path to select model

### useEditor

```typescript
function useEditor(options: {
  // must provide monaco instance from useMonaco hook
  monaco?: typeof monaco;

  // model to assign to editor (get this from useMonacoModel hook)
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
- Creates a monaco code editor which provides a `containerRef` that you will need to render as a `div` in your React app.
- Uses models to show content.
- Can be used multiple times with multiple models to get a bunch of editors
- Controlled and uncontrolled based on how you control the model
- Returns editor instance so that you can play with it
