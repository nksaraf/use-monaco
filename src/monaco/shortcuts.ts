import { createPlugin } from './plugin-api';

export default createPlugin(
  {
    name: 'core.shortcuts',
    dependencies: ['core.editors'],
  },
  (monaco) => {
    return monaco.editor.onDidCreateEditor((editor) => {
      if (editor.getRawOptions()?.formatOnSave) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
          editor?.trigger('ctrl-s', 'editor.action.formatDocument', null);
        });
      }
      // }
      // for firefox support (wasn't able to intercept key)
      // editor.addCommand(
      //   monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_C,
      //   () => {
      //     editor.trigger('ctrl-shift-c', 'editor.action.quickCommand', null);
      //   }
      // );
      // editor.addCommand(
      //   monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_P,
      //   () => {
      //     editor.trigger('ctrl-shift-p', 'editor.action.quickCommand', null);
      //   }
      // );
      // window.addEventListener('keydown', (event: any) => {
      //   if (event.metaKey && event.shiftKey && event.code === 'KeyP') {
      //     editor.trigger('ctrl-shift-p', 'editor.action.quickCommand', null);
      //     event.stopPropagation();
      //   }
      // });
    });
  }
);
