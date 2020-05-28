import React from 'react';
import {
  asDisposable,
  noop,
  processDimensions,
  getNextWorkerPath,
  fixPath,
} from '../utils';
import monaco from '../monaco';
import defaultThemes, { ThemeNames, themeNames } from '@themes';
import { useRefWithEffects } from '../hooks';

// function setupThemes(
//   monacoApi: typeof monaco,
//   editor: monaco.editor.IStandaloneCodeEditor,
//   themes: MonacoEditorProps['themes']
// ) {
//   const allThemes = {
//     ...defaultThemes,
//     ...themes,
//   };

//   Object.keys(allThemes).forEach((themeName) => {
//     monacoApi.editor.defineTheme(
//       themeName,
//       allThemes[themeName as keyof typeof allThemes]
//     );
//   });

//   editor.addSelectAction({
//     id: 'editor.action.selectTheme',
//     label: 'Preferences: Color Theme',
//     choices: () => Object.keys(themeNames),
//     runChoice: (choice, mode, ctx, api) => {
//       if (mode === 0) {
//         api.editor.setTheme(themeNames[choice]);
//       } else if (mode === 1) {
//         api.editor.setTheme(themeNames[choice]);
//       }
//     },
//     runAction: function (editor: any, api: any) {
//       const _this: any = this;
//       const currentTheme = editor._themeService._theme.themeName;
//       console.log(currentTheme);
//       const controller = _this.getController(editor);
//       const oldDestroy = controller.widget.quickOpenWidget.callbacks.onCancel;
//       controller.widget.quickOpenWidget.callbacks.onCancel = function () {
//         debugger;
//         monaco.editor.setTheme(currentTheme);
//         oldDestroy();
//       };
//       console.log(
//         controller,
//         controller.widget.quickOpenWidget.callbacks.onCancel,
//         this
//       );
//       _this.show(editor);
//       return Promise.resolve();
//     },
//   });
// }

// const getNextWorkerUrl = (label: string) => {
//   if (label === 'editorWorkerService') {
//     return getNextWorkerPath('editor');
//   }

//   if (label === 'typescript' || label === 'javascript') {
//     return getNextWorkerPath('ts');
//   }

//   return getNextWorkerPath(label);
// };

export interface MonacoEditorProps {
  width?: string | number;
  height?: string | number;
  value?: string;
  id?: string;
  containerProps?: any;
  defaultValue?: string;
  line?: number;
  monacoRef?:
    | ((instance: typeof monaco) => void)
    | React.MutableRefObject<typeof monaco>;
  style?: React.CSSProperties;
  path?: string;
  language?: string;
  files?: { [key: string]: string };
  theme?: ThemeNames | monaco.editor.IStandaloneThemeData;
  themes?: { [key: string]: monaco.editor.IStandaloneThemeData };
  options?: monaco.editor.IEditorOptions;
  overrideServices?:
    | monaco.editor.IEditorOverrideServices
    | ((
        monacoApi: typeof monaco
        // model: monaco.editor.ITextModel
      ) => monaco.editor.IEditorOverrideServices);
  className?: string;
  getWorker?: (label: string) => Worker | undefined;
  getWorkerUrl?: (label: string) => string | undefined;
  syncAllFiles?: boolean;
  editorDidMount?: (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoApi: typeof monaco
  ) => monaco.IDisposable[] | Promise<void> | void;
  editorWillMount?: (
    monacoApi: typeof monaco,
    containerRef: React.RefObject<HTMLDivElement>
  ) => monaco.editor.IEditorOptions | void;
  onPathChange?: (
    path: string,
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoApi: typeof monaco
  ) => void;
  onThemeChange?: (theme: string, monacoApi: typeof monaco) => void;
  onChange?: (
    newValue: string,
    editor: monaco.editor.IStandaloneCodeEditor,
    event: monaco.editor.IModelContentChangedEvent,
    monacoApi: typeof monaco
  ) => void;
  plugins?: monaco.plugin.IPlugin[];
}

// const editorStates = new Map();
// const useFS = ({ files }) => {};



export const MonacoEditor = React.forwardRef<
  monaco.editor.IStandaloneCodeEditor,
  MonacoEditorProps
>(
  (
    {
      width = '100%',
      height = '100%',
      value,
      id = 'monaco',
      defaultValue = '',
      style = {},
      className = 'next-editor',
      line = 0,
      getWorkerUrl = getNextWorkerUrl,
      getWorker = noop as any,
      language,
      syncAllFiles = false,
      theme = 'vs-dark',
      monacoRef,
      path = `model${
        // @ts-ignore
        (monaco.languages.getLanguages().find((l) => l.id === language)
          ?.extensions[0] as any) ?? '.js'
      }`,
      files = {
        [fixPath(path)]: value != null ? value : defaultValue,
      },
      plugins = [],
      themes = {},
      options = {},
      overrideServices = {},
      editorDidMount = noop,
      editorWillMount = noop,
      onChange = noop,
      onThemeChange = noop,
      onPathChange = noop,
      containerProps = {},
    }: MonacoEditorProps,
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [editorRef, useEditorEffect] = useRefWithEffects<
      monaco.editor.IStandaloneCodeEditor & { monaco: typeof monaco }
    >();
    const subscriptionRef = React.useRef<monaco.IDisposable>(null);

    path = fixPath(path);

    React.useEffect(() => {
      if (!containerRef.current) {
        console.error('Assign container ref to something');
        return;
      }

      monaco.worker.setEnvironment(getWorkerUrl, getWorker);

      options = Object.assign(
        {
          automaticLayout: true,
          formatOnSave: true,
        },
        options,
        editorWillMount(monaco, containerRef) || {}
      );

      const pluginDisposables = monaco.plugin.install(...plugins);

      if (syncAllFiles) {
        Object.keys(files).forEach((path) =>
          initializeModel(path, files[path])
        );
      }

      editorRef.current = Object.assign(
        monaco.editor.create(
          containerRef.current,
          options,
          typeof overrideServices === 'function'
            ? overrideServices(monaco)
            : overrideServices
        ),
        { monaco: monaco }
      );

      // editor ref
      if (ref) {
        if (typeof ref === 'function') {
          ref(editorRef.current);
        } else {
          (ref as any).current = editorRef.current;
        }
      }

      if (monacoRef) {
        if (typeof monacoRef === 'function') {
          monacoRef(monaco);
        } else {
          (monacoRef as any).current = monaco;
        }
      }

      // CMD + Shift + P (like vscode), CMD + Shift + C
      const themeListener = monaco.editor.onDidChangeTheme((theme) =>
        onThemeChange(theme, monaco)
      );

      setupThemes(monaco, editorRef.current, themes);

      // After initializing monaco editor
      let didMount = editorDidMount(editorRef.current, monaco);
      let userDisposables: monaco.IDisposable;
      if (didMount && Array.isArray(didMount)) {
        userDisposables = asDisposable(didMount);
      }

      return () => {
        themeListener.dispose();
        pluginDisposables.dispose();
        if (userDisposables) {
          (userDisposables as monaco.IDisposable).dispose();
        }
        if (editorRef.current) {
          editorRef.current.dispose();
        }
        monaco.editor.getModels().forEach((model) => {
          model.dispose();
        });
      };
    }, []);

    useEditorEffect(
      (editor) => {
        // var oldModel = editor.getModel();
        // if (oldModel) {
        //   editorStates.set(oldModel.uri.path, editor.saveViewState());
        // }
        initializeModel(path, files[path]);
        const model = findModel(path);

        editor.setModel(model);
        if (onPathChange) {
          onPathChange(path, editor, monaco);
        }
        // const editorState = editorStates.get(path);
        // if (editorState) {
        //   editor.restoreViewState(editorState);
        // }

        editor.focus();
      },
      [path]
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

    useEditorEffect(
      (editor) => {
        editor.setScrollPosition({ scrollTop: line });
      },
      [line]
    );

    React.useEffect(() => {
      monaco.editor.setTheme(theme);
    }, [theme]);

    useEditorEffect(
      (editor) => {
        editor.updateOptions(options);
      },
      [options]
    );

    useEditorEffect(
      (editor) => {
        const model = editor.getModel();
        if (model && language) {
          monaco.editor.setModelLanguage(model, language);
        }
      },
      [language]
    );

    useEditorEffect(
      (editor) => {
        const model = editor.getModel();
        let value = files[path];
        if (model && value && value !== model.getValue()) {
          // isChangingRef.current = true;
          // editorRef.current.pushUndoStop();
          model.pushEditOperations(
            [],
            [
              {
                range: model.getFullModelRange(),
                text: value,
              },
            ],
            () => null
          );
          // editorRef.current.pushUndoStop();
          // isChangingRef.current = false;
        }
      },
      [files[path]]
    );

    return (
      <div
        {...containerProps}
        ref={containerRef}
        id={id}
        data-editor="monaco"
        className={`${className} ${theme}`}
        style={{
          overflow: 'hidden',
          ...processDimensions(width, height),
          ...style,
        }}
      />
    );
  }
);

export default MonacoEditor;
export { monaco };
// import MONACO = monaco;
// export { MONACO };
