import type * as monacoApi from 'monaco-editor';
import React from 'react';
import useDeepCompareEffect from './useDeepCompareEffect';
import { noop, asDisposable } from '../monaco';
import { MonacoProp, useMonacoContext } from './useMonaco';

export interface UseEditorOptions {
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
  onEditorDidMount?: (
    editor: monacoApi.editor.IStandaloneCodeEditor,
    monaco: typeof monacoApi
  ) => monacoApi.IDisposable[] | Promise<void> | void;
}

export const useEditor = ({
  options = {},
  onEditorDidMount = noop,
  model,
  monaco: customMonaco,
  overrideServices,
  onChange = noop,
}: UseEditorOptions & MonacoProp & { model: monacoApi.editor.ITextModel }) => {
  // const [container, setContainer] = React.useRef<HTMLDivElement>();
  const monacoContext = useMonacoContext();
  const contextMonaco = monacoContext?.monaco;
  const monaco = customMonaco || contextMonaco;

  const defaultEditorOptions = React.useRef(
    monacoContext?.defaultEditorOptions
  );
  defaultEditorOptions.current = monacoContext?.defaultEditorOptions;

  const [container, setContainer] = React.useState<HTMLDivElement>();
  const [editor, setEditor, useEditorEffect] = useStateWithEffects<
    monacoApi.editor.IStandaloneCodeEditor
  >();

  const editorRef = React.useRef(editor);
  editorRef.current = editor;

  const elWatcher = useElementWatcher((el) => {
    if (el !== container) {
      setContainer(el);
    }
  });

  const subscriptionRef = React.useRef<monacoApi.IDisposable>(null);

  React.useEffect(() => {
    if (!monaco || !container) {
      return;
    }

    if (container.getElementsByClassName('monaco-editor').length === 0) {
      console.log(`[monaco] creating editor`, { options, container });

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      const monacoEditor = monaco.editor.create(
        container,
        { ...(defaultEditorOptions.current ?? {}), ...options },
        typeof overrideServices === 'function'
          ? overrideServices(monaco)
          : overrideServices
      );

      let didMount = onEditorDidMount(monacoEditor, monaco);
      let userDisposables: monacoApi.IDisposable;
      if (didMount && Array.isArray(didMount)) {
        userDisposables = asDisposable(didMount);
      }

      setEditor(monacoEditor);

      return () => {
        if (userDisposables) {
          (userDisposables as monacoApi.IDisposable).dispose();
        }
      };
    }
  }, [monaco, container, setEditor]);

  React.useEffect(() => {
    return () => {
      if (editor) {
        editor?.dispose?.();
      }
    };
  }, []);

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

  useDeepCompareEffect(
    () => {
      if (editor) {
        editor.updateOptions(options);
      }
    },
    [options],
    [editor]
  );

  return {
    containerRef: elWatcher,
    useEditorEffect,
    editor,
  };
};
function useElementWatcher(watcher) {
  const lastRef = React.useRef(null);

  const elRef = React.useRef((el) => {
    lastRef.current?.();
    lastRef.current = el ? watcher(el) : null;
  });

  return elRef.current;
}

function useStateWithEffects<T>() {
  const [state, setState] = React.useState<T>();
  const useStateEffect = (effect: (obj: T) => void, deps: any[]) => {
    React.useEffect(() => {
      if (state) {
        return effect(state);
      }
    }, [state, ...deps]);
  };

  return [state, setState, useStateEffect] as const;
}
