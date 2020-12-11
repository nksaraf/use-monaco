import { noop, asDisposable } from '../monaco/utils';
import type * as monacoApi from 'monaco-editor';
import React from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { Monaco } from '../monaco';

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
  monaco,
  overrideServices,
  onChange = noop,
}: UseEditorOptions & Monaco & { model: monacoApi.editor.ITextModel }) => {
  // const [container, setContainer] = React.useRef<HTMLDivElement>();
  const [container, setContainer] = React.useState<HTMLDivElement>();
  const [editor, setEditor, useEditorEffect] = useStateWithEffects<
    monacoApi.editor.IStandaloneCodeEditor
  >();
  const editorRef = React.useRef<monacoApi.editor.IStandaloneCodeEditor>();
  // const [editorRef, useEditorEffect] = useRefWithEffect<
  //   monacoApi.editor.IStandaloneCodeEditor
  // >();

  const elWatcher = useElementWatcher((el) => {
    // containerRef.current = el;
    setContainer(el);
    if (!monaco) {
      return;
    }
  });

  const subscriptionRef = React.useRef<monacoApi.IDisposable>(null);

  React.useEffect(() => {
    if (!monaco) {
      return;
    }

    // if (!containerRef.current) {
    //   console.error('Assign container ref to something');
    //   return;
    // }

    if (!container) {
      console.error('Assign container ref to something');
      return;
    }

    options = Object.assign(
      {
        automaticLayout: true,
        formatOnSave: true,
      },
      options,
      editorWillMount(monaco) || {}
    );

    editorRef.current = monaco.editor.create(
      container,
      options,
      typeof overrideServices === 'function'
        ? overrideServices(monaco)
        : overrideServices
    );

    console.log(
      `[monaco] created editor with options: `,
      options,
      ` in container:`,
      container
    );

    // After initializing monaco editor
    //@ts-ignore
    let didMount = editorDidMount(editorRef.current, monaco);
    let userDisposables: monacoApi.IDisposable;
    if (didMount && Array.isArray(didMount)) {
      userDisposables = asDisposable(didMount);
    }

    setEditor(editorRef.current);

    return () => {
      // themeListener.dispose();
      if (userDisposables) {
        (userDisposables as monacoApi.IDisposable).dispose();
      }
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [monaco, container]);

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
    if (editor) {
      editor.updateOptions(options);
    }
  }, [editor, options]);

  return {
    // containerRef: containerRef as React.MutableRefObject<HTMLDivElement | null>,
    containerRef: elWatcher,
    editor,
  };
};
