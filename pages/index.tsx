import React from 'react';
import * as monacoApi from 'monaco-editor';
import { useMonaco } from '../src/useMonaco';

export function asDisposable(
  disposables: monacoApi.IDisposable[]
): monacoApi.IDisposable {
  return { dispose: () => disposeAll(disposables) };
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

export const getNextWorkerPath = (label: string) => {
  return `_next/static/workers/${label}.monaco.worker.js`;
};

export const fixPath = (path: string) =>
  path.startsWith('/') ? path : `/${path}`;

export function noop() {}

export interface EditorProps {
  loading?: React.ReactNode;
}

export function useRefWithEffects<T>(): [
  React.MutableRefObject<T | undefined>,
  (effect: (obj: T) => void, deps: any[]) => void
] {
  const ref = React.useRef<T>();
  const useRefEffect = (effect: (obj: T) => void, deps: any[]) => {
    React.useEffect(() => {
      if (ref.current) {
        return effect(ref.current);
      }
    }, [...deps]);
  };

  return [ref, useRefEffect];
}



export const useEditor = ({
  options = {},
  editorWillMount = noop,
  editorDidMount = noop,
  model,
  monaco,
  overrideServices,
  onChange = noop,
}: {
  monaco?: typeof monacoApi;
  onChange?: (
    newValue: string,
    editor: monacoApi.editor.IStandaloneCodeEditor,
    event: monacoApi.editor.IModelContentChangedEvent,
    monaco: typeof monacoApi
  ) => void;
  overrideServices?:
    | monacoApi.editor.IEditorOverrideServices
    | ((
        monaco: typeof monacoApi
        // model: monaco.editor.ITextModel
      ) => monacoApi.editor.IEditorOverrideServices);
  options?: monacoApi.editor.IEditorOptions;
  editorDidMount?: (
    editor: monacoApi.editor.IStandaloneCodeEditor,
    monaco: typeof monacoApi
  ) => monacoApi.IDisposable[] | Promise<void> | void;
  editorWillMount?: (
    monaco: typeof monacoApi,
    containerRef: React.RefObject<HTMLDivElement>
  ) => monacoApi.editor.IEditorOptions | void;
  model?: monacoApi.editor.ITextModel;
}) => {
  const containerRef = React.useRef();
  const [editorRef, useEditorEffect] = useRefWithEffects<
    monacoApi.editor.IStandaloneCodeEditor
  >();
  const subscriptionRef = React.useRef<monacoApi.IDisposable>(null);

  React.useEffect(() => {
    if (!monaco) {
      return;
    }

    if (!containerRef.current) {
      console.error('Assign container ref to something');
      return;
    }

    // monaco.worker.setEnvironment(getWorkerUrl, getWorker);

    options = Object.assign(
      {
        automaticLayout: true,
        formatOnSave: true,
      },
      options,
      //@ts-ignore
      editorWillMount(monaco, containerRef) || {}
    );

    // const pluginDisposables = monaco.plugin.install(...plugins);

    editorRef.current = monaco.editor.create(
      containerRef.current,
      options,
      typeof overrideServices === 'function'
        ? overrideServices(monaco)
        : overrideServices
    );

    // CMD + Shift + P (like vscode), CMD + Shift + C
    // const themeListener = monaco.editor.onDidChangeTheme((theme) =>
    //   onThemeChange(theme, monaco)
    // );

    // setupThemes(monaco, editorRef.current, themes);

    // After initializing monaco editor
    //@ts-ignore
    let didMount = editorDidMount(editorRef.current, monaco);
    let userDisposables: monacoApi.IDisposable;
    if (didMount && Array.isArray(didMount)) {
      userDisposables = asDisposable(didMount);
    }

    return () => {
      // themeListener.dispose();
      // pluginDisposables.dispose();
      if (userDisposables) {
        (userDisposables as monacoApi.IDisposable).dispose();
      }
      if (editorRef.current) {
        editorRef.current.dispose();
      }
      if (monaco) {
        monaco.editor.getModels().forEach((model) => {
          model.dispose();
        });
      }
    };
  }, [monaco]);

  useEditorEffect(
    (editor) => {
      if (model) {
        editor.setModel(model);
      }
    },
    [model]
  );

  useEditorEffect(
    (editor) => {
      // @ts-ignore
      subscriptionRef.current = editor.onDidChangeModelContent((event) => {
        if (editor) {
          onChange(editor?.getValue(), editor, event, monaco);
        }
      });
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.dispose();
        }
      };
    },
    [onChange]
  );

  useDeepCompareEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions(options);
    }
  }, [options]);

  return { containerRef, editor: editorRef.current };
};

// export const useEditor = ({
//   monaco,
//   width = '100%',
//   height = '100%',
//   value,
//   id = 'monaco',
//   defaultValue = '',
//   style = {},
//   className = 'next-editor',
//   line = 0,
//   // getWorkerUrl = getNextWorkerUrl,
//   getWorker = noop as any,
//   language,
//   syncAllFiles = false,
//   theme = 'vs-dark',
//   // monacoRef,
//   path = `model${
//     (monaco?.languages.getLanguages().find((l) => l.id === language)
//       ?.extensions[0] as any) ?? '.js'
//   }`,
//   files = {
//     [fixPath(path)]: value != null ? value : defaultValue,
//   },
//   plugins = [],
//   themes = {},
//   options = {},
//   overrideServices = {},
//   editorDidMount = noop,
//   editorWillMount = noop,
//   onChange = noop,
//   onThemeChange = noop,
//   onPathChange = noop,
//   containerProps = {},
// }: MonacoEditorProps) => {
//   function findModel(path: string) {
//     return monaco.editor.getModel(monaco.Uri.file(fixPath(path)));
//   }

//   function initializeModel(path: string, value?: string, language?: string) {
//     path = fixPath(path);
//     let model = findModel(path);

//     if (model) {
//       // If a model exists, we need to update it's value
//       // This is needed because the content for the file might have been modified externally
//       // Use `pushEditOperations` instead of `setValue` or `applyEdits` to preserve undo stack
//       if (value) {
//         model.pushEditOperations(
//           [],
//           [
//             {
//               range: model.getFullModelRange(),
//               text: value,
//             },
//           ],
//           () => null
//         );
//       }
//     } else {
//       model = monaco.editor.createModel(
//         value || '',
//         language,
//         monaco.Uri.file(path)
//       );
//       model.updateOptions({
//         tabSize: 2,
//         insertSpaces: true,
//       });
//     }
//   }

//   console.log('here');
//   const containerRef = React.useRef();
//   const [editorRef, useEditorEffect] = useRefWithEffects<
//     monacoApi.editor.IStandaloneCodeEditor & { monaco: typeof monaco }
//   >();
//   const subscriptionRef = React.useRef<monacoApi.IDisposable>(null);

//   path = fixPath(path);

//   React.useEffect(() => {
//     if (!containerRef.current && monaco) {
//       console.error('Assign container ref to something');
//       return;
//     }

//     // monaco.worker.setEnvironment(getWorkerUrl, getWorker);

//     options = Object.assign(
//       {
//         automaticLayout: true,
//         formatOnSave: true,
//       },
//       options,
//       editorWillMount(monaco, containerRef) || {}
//     );

//     // const pluginDisposables = monaco.plugin.install(...plugins);

//     if (syncAllFiles) {
//       Object.keys(files).forEach((path) => initializeModel(path, files[path]));
//     }

//     editorRef.current = Object.assign(
//       monaco.editor.create(
//         containerRef.current,
//         options,
//         typeof overrideServices === 'function'
//           ? overrideServices(monaco)
//           : overrideServices
//       ),
//       { monaco: monaco }
//     );

//     // CMD + Shift + P (like vscode), CMD + Shift + C
//     // const themeListener = monaco.editor.onDidChangeTheme((theme) =>
//     //   onThemeChange(theme, monaco)
//     // );

//     // setupThemes(monaco, editorRef.current, themes);

//     // After initializing monaco editor
//     let didMount = editorDidMount(editorRef.current, monaco);
//     let userDisposables: monacoApi.IDisposable;
//     if (didMount && Array.isArray(didMount)) {
//       userDisposables = asDisposable(didMount);
//     }

//     return () => {
//       // themeListener.dispose();
//       // pluginDisposables.dispose();
//       if (userDisposables) {
//         (userDisposables as monacoApi.IDisposable).dispose();
//       }
//       if (editorRef.current) {
//         editorRef.current.dispose();
//       }
//       monaco.editor.getModels().forEach((model) => {
//         model.dispose();
//       });
//     };
//   }, [monaco]);

//   useEditorEffect(
//     (editor) => {
//       editor.setScrollPosition({ scrollTop: line });
//     },
//     [line]
//   );

//   React.useEffect(() => {
//     // monaco.editor.setTheme(theme);
//   }, [theme]);

//   useEditorEffect(
//     (editor) => {
//       editor.updateOptions(options);
//     },
//     [options]
//   );

//   useEditorEffect(
//     (editor) => {
//       const model = editor.getModel();
//       if (model && language) {
//         monaco.editor.setModelLanguage(model, language);
//       }
//     },
//     [language]
//   );

//   useEditorEffect(
//     (editor) => {
//       const model = editor.getModel();
//       let value = files[path];
//       if (model && value && value !== model.getValue()) {
//         // isChangingRef.current = true;
//         // editorRef.current.pushUndoStop();
//         model.pushEditOperations(
//           [],
//           [
//             {
//               range: model.getFullModelRange(),
//               text: value,
//             },
//           ],
//           () => null
//         );
//         // editorRef.current.pushUndoStop();
//         // isChangingRef.current = false;
//       }
//     },
//     [files[path]]
//   );
//   return { containerRef, editor: editorRef.current };
// };

let Editor = React.forwardRef<any, any>(
  ({ width = 800, height = 600, id = 'monaco', ...props }: any, ref) => {
    const { monaco, loading } = useMonaco();
    const model = useEditorModel({
      path: 'model.js',
      monaco,
      defaultValue: 'hello',
    });
    console.log(model);
    const { containerRef, editor } = useEditor({ model, monaco });

    // props.theme =
    //   (window.localStorage.getItem(`${id}-theme`) as any) ||
    //   props.theme ||
    //   'vs-dark';

    // props.onThemeChange =
    //   props.onThemeChange ||
    //   ((theme) => window.localStorage.setItem(`${id}-theme`, theme));

    return (
      <div style={processDimensions(width, height)}>
        <div ref={containerRef} style={{ width: 800, height: 600 }} />
        {/* <Suspense
          fallback={
            loading ? (
              <Loading>{loading}</Loading>
            ) : (
              <SpectrumLoading
                {...props}
                id={id}
                // themes={allThemes}
                width={width}
                height={height}
              />
            )
          }
        >
          <MonacoEditor {...props} id={id} ref={ref} />
        </Suspense> */}
      </div>
    );
  }
);

export default () => {
  return (
    <div>
      <Editor />
    </div>
  );
};
