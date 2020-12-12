import type * as monacoApi from 'monaco-editor';
import React from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { Monaco, noop, asDisposable } from '../monaco';
import { useMonacoContext } from './useMonaco';

export function useRefWithEffect<T>(): [
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
  editorDidMount?: (
    editor: monacoApi.editor.IStandaloneCodeEditor,
    monaco: typeof monacoApi
  ) => monacoApi.IDisposable[] | Promise<void> | void;
  editorWillMount?: (
    monaco: typeof monacoApi
    // containerRef: React.RefObject<HTMLDivElement>
  ) => monacoApi.editor.IEditorOptions | void;
}
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
  const useRefEffect = (effect: (obj: T) => void, deps: any[]) => {
    React.useEffect(() => {
      if (state) {
        return effect(state);
      }
    }, [state, ...deps]);
  };

  return [state, setState, useRefEffect] as const;
}

export const useEditor = ({
  options = {},
  editorWillMount = noop,
  editorDidMount = noop,
  model,
  monaco: customMonaco,
  overrideServices,
  onChange = noop,
}: UseEditorOptions & Monaco & { model: monacoApi.editor.ITextModel }) => {
  // const [container, setContainer] = React.useRef<HTMLDivElement>();
  const contextMonaco = useMonacoContext()?.monaco;
  const monaco = customMonaco || contextMonaco;

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
      options = Object.assign(
        {
          automaticLayout: true,
          formatOnSave: true,
        },
        options,
        editorWillMount(monaco) || {}
      );

      const monacoEditor = monaco.editor.create(
        container,
        options,
        typeof overrideServices === 'function'
          ? overrideServices(monaco)
          : overrideServices
      );

      let didMount = editorDidMount(monacoEditor, monaco);
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

  useDeepCompareEffect(() => {
    if (editor) {
      editor.updateOptions(options);
    }
  }, [editor, options]);

  return {
    containerRef: elWatcher,
    editor,
  };
};
