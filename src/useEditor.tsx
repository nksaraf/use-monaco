import { noop, asDisposable } from './utils';
import * as monacoApi from 'monaco-editor';
import React from 'react';
import { useRefWithEffects } from 'useRefEffect';
import useDeepCompareEffect from 'use-deep-compare-effect';

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
    monaco: typeof monacoApi
    // containerRef: React.RefObject<HTMLDivElement>
  ) => monacoApi.editor.IEditorOptions | void;
  model?: monacoApi.editor.ITextModel;
}) => {
  const containerRef = React.useRef<HTMLDivElement>();
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
      editorWillMount(monaco) || {}
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
          onChange(editor?.getValue(), editor, event, monaco as any);
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

  return {
    containerRef: containerRef as React.MutableRefObject<HTMLDivElement | null>,
    editor: editorRef.current,
  };
};
