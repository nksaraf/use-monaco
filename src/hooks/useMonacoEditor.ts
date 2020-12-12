import { useFile, UseFileOptions } from './useFile';
import { useEditor, UseEditorOptions } from './useEditor';
import { useMonaco, UseMonacoOptions } from './useMonaco';

export const useMonacoEditor = ({
  paths,
  onLoad,
  plugins,
  path,
  defaultContents,
  contents,
  language,
  editorDidMount,
  editorWillMount,
  theme,
  options,
  // files,
  // syncAllFiles,
  overrideServices,
  onChange,
}: UseEditorOptions & UseFileOptions & UseMonacoOptions = {}) => {
  const { monaco, isLoading } = useMonaco({
    paths,
    onLoad,
    plugins,
    theme,
  });

  const model = useFile({
    path,
    contents,
    defaultContents,
    language,
    // files,
    // syncAllFiles,
    monaco,
  });

  const { containerRef, editor } = useEditor({
    model,
    monaco,
    editorDidMount,
    editorWillMount,
    onChange,
    overrideServices,
    options,
  });

  return { monaco, isLoading, model, containerRef, editor };
};
