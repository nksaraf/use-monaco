import React from 'react';
import {
  useLocalStorage,
  useTextModel,
  useEditor,
  plugins,
  useMonacoContext,
  parseJSONWithComments,
} from '../src';
import { withMonaco } from '../src';

export function App() {
  const [theme, setTheme] = React.useState(`{
    "$schema": "vscode://schemas/color-theme",
    "type": "dark",
    "colors": {
      "activityBar.activeBorder": "#80cbc4",
      "activityBar.background": "#1b2b34",
      "activityBar.border": "#80cbc430",
      "activityBar.foreground": "#f7f7f7",
      "activityBar.inactiveForeground": "#607d8b",
      "activityBarBadge.background": "#80cbc4",
      "activityBarBadge.foreground": "#000000",
      "badge.background": "#d8dee9",
      "badge.foreground": "#000000",
      "breadcrumb.activeSelectionForeground": "#80cbc4",
      "breadcrumb.background": "#1b2b3430",
      "breadcrumb.focusForeground": "#d8dee9",
      "breadcrumb.foreground": "#607d8b",
      "breadcrumbPicker.background": "#1b2b34",
      "button.background": "#80cbc4",
      "button.foreground": "#000000",
      "button.hoverBackground": "#6699cc",
      "debugToolBar.background": "#1b2b34",
      "dropdown.background": "#273942",
      "dropdown.border": "#273942",
      "dropdown.foreground": "#d8dee9",
      "dropdown.listBackground": "#273942",
      "editor.background": "#273942",
      "editor.findMatchBackground": "#f9875775",
      "editor.findMatchBorder": "#00000000",
      "editor.findMatchHighlightBackground": "#f9ae5875",
      "editor.findMatchHighlightBorder": "#00000000",
      "editor.findRangeHighlightBorder": "#00000000",
      "editor.foreground": "#d8dee9",
      "editor.hoverHighlightBackground": "#80cbc420",
      "editor.inactiveSelectionBackground": "#80cbc410",
      "editor.lineHighlightBackground": "#00000000",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#607d8b80",
      "editor.selectionHighlightBackground": "#80cbc415",
      "editor.selectionHighlightBorder": "#00000000",
      "editor.wordHighlightBackground": "#6699cc25",
      "editor.wordHighlightBorder": "#00000000",
      "editorBracketMatch.background": "#6699cc50",
      "editorBracketMatch.border": "#00000000",
      "editorCursor.foreground": "#f9ae58",
      "editorError.border": "#00000000",
      "editorError.foreground": "#ec5f6790",
      "editorGroup.border": "#1b2b3430",
      "editorGroupHeader.noTabsBackground": "#1b2b34",
      "editorGroupHeader.tabsBackground": "#1b2b34",
      "editorGutter.addedBackground": "#99c79450",
      "editorGutter.background": "#273942",
      "editorGutter.deletedBackground": "#ec5f6750",
      "editorGutter.modifiedBackground": "#6699cc50",
      "editorHint.border": "#00000000",
      "editorHint.foreground": "#afbdc490",
      "editorIndentGuide.activeBackground": "#afbdc430",
      "editorIndentGuide.background": "#4e5d6530",
      "editorInfo.border": "#00000000",
      "editorInfo.foreground": "#afbdc490",
      "editorLineNumber.activeForeground": "#afbdc4",
      "editorLineNumber.foreground": "#4e5d65",
      "editorLink.activeForeground": "#00000000",
      "editorOverviewRuler.addedForeground": "#99c79450",
      "editorOverviewRuler.border": "#1b2b34",
      "editorOverviewRuler.deletedForeground": "#ec5f6750",
      "editorOverviewRuler.errorForeground": "#ec5f6780",
      "editorOverviewRuler.modifiedForeground": "#6699cc50",
      "editorOverviewRuler.warningForeground": "#fac86350",
      "editorSuggestWidget.background": "#1b2b34",
      "editorSuggestWidget.border": "#1b2b3410",
      "editorSuggestWidget.foreground": "#d8dee9",
      "editorSuggestWidget.highlightForeground": "#80cbc4",
      "editorSuggestWidget.selectedBackground": "#00000050",
      "editorUnnecessaryCode.border": "#607d8b",
      "editorWarning.border": "#00000000",
      "editorWarning.foreground": "#fac86370",
      "editorWhitespace.foreground": "#d8dee935",
      "editorWidget.background": "#1b2b34",
      "editorWidget.border": "#1b2b34",
      "editorWidget.resizeBorder": "#80cbc4",
      "errorForeground": "#ec5f67",
      "extensionButton.prominentBackground": "#000000",
      "extensionButton.prominentForeground": "#80cbc4",
      "extensionButton.prominentHoverBackground": "#6699cc",
      "focusBorder": "#f7f7f700",
      "foreground": "#d8dee9",
      "gitDecoration.addedResourceForeground": "#99c794",
      "gitDecoration.deletedResourceForeground": "#ec5f67",
      "gitDecoration.modifiedResourceForeground": "#6699cc",
      "gitDecoration.untrackedResourceForeground": "#fac863",
      "input.background": "#1b2b34",
      "input.border": "#273942",
      "input.foreground": "#f7f7f7",
      "input.placeholderForeground": "#607d8b",
      "list.activeSelectionBackground": "#607d8b50",
      "list.activeSelectionForeground": "#80cbc4",
      "list.dropBackground": "#607d8b50",
      "list.focusBackground": "#607d8b50",
      "list.hoverBackground": "#607d8b20",
      "list.hoverForeground": "#d8dee9",
      "list.inactiveSelectionBackground": "#607d8b30",
      "list.inactiveSelectionForeground": "#80cbc4",
      "menu.background": "#1b2b34",
      "menu.foreground": "#d8dee9",
      "menu.selectionBackground": "#607d8b50",
      "menu.selectionForeground": "#f7f7f7",
      "panel.background": "#1b2b34",
      "panel.border": "#80cbc430",
      "panelTitle.activeBorder": "#80cbc4",
      "panelTitle.activeForeground": "#f7f7f7",
      "panelTitle.inactiveForeground": "#607d8b",
      "progressBar.background": "#80cbc4",
      "scrollbar.shadow": "#1b2b3470",
      "settings.checkboxBackground": "#1b2b34",
      "settings.checkboxBorder": "#1b2b34",
      "settings.checkboxForeground": "#f7f7f7",
      "settings.dropdownBackground": "#1b2b34",
      "settings.dropdownBorder": "#1b2b34",
      "settings.dropdownForeground": "#d8dee9",
      "settings.dropdownListBorder": "#1b2b34",
      "settings.headerForeground": "#80cbc4",
      "settings.modifiedItemIndicator": "#5fb3b3",
      "settings.numberInputBackground": "#1b2b34",
      "settings.numberInputBorder": "#1b2b34",
      "settings.numberInputForeground": "#fac863",
      "settings.textInputBackground": "#1b2b34",
      "settings.textInputBorder": "#1b2b34",
      "settings.textInputForeground": "#99c794",
      "sideBar.background": "#1b2b34",
      "sideBar.border": "#80cbc430",
      "sideBar.dropBackground": "#1b2b3430",
      "sideBar.foreground": "#607d8b",
      "sideBarSectionHeader.background": "#1b2b34",
      "sideBarSectionHeader.border": "#80cbc430",
      "sideBarSectionHeader.foreground": "#d8dee9",
      "sideBarTitle.foreground": "#d8dee9",
      "statusBar.background": "#1b2b34",
      "statusBar.border": "#80cbc430",
      "statusBar.debuggingBackground": "#80cbc4",
      "statusBar.debuggingBorder": "#80cbc4",
      "statusBar.debuggingForeground": "#000000",
      "statusBar.foreground": "#607d8b",
      "statusBar.noFolderBackground": "#1b2b34",
      "statusBar.noFolderBorder": "#1b2b34",
      "statusBar.noFolderForeground": "#607d8b",
      "statusBarItem.activeBackground": "#273942",
      "statusBarItem.hoverBackground": "#607d8b20",
      "statusBarItem.prominentBackground": "#80cbc4",
      "statusBarItem.prominentForeground": "#000000",
      "statusBarItem.prominentHoverBackground": "#6699cc",
      "tab.activeBackground": "#273942",
      "tab.activeBorder": "#80cbc4",
      "tab.activeForeground": "#f7f7f7",
      "tab.activeModifiedBorder": "#607d8b",
      "tab.border": "#1b2b34",
      "tab.hoverBackground": "#273942",
      "tab.inactiveBackground": "#1b2b34",
      "tab.inactiveForeground": "#607d8b",
      "tab.unfocusedActiveBorder": "#607d8b",
      "tab.unfocusedActiveForeground": "#d8dee9",
      "terminal.ansiBlack": "#4e5d65",
      "terminal.ansiBlue": "#6699cc",
      "terminal.ansiBrightBlack": "#4e5d65",
      "terminal.ansiBrightBlue": "#42a5f5",
      "terminal.ansiBrightCyan": "#00aca2",
      "terminal.ansiBrightGreen": "#cddc39",
      "terminal.ansiBrightMagenta": "#d81b60",
      "terminal.ansiBrightRed": "#ec5f67",
      "terminal.ansiBrightWhite": "#d8dee9",
      "terminal.ansiBrightYellow": "#ffc135",
      "terminal.ansiCyan": "#5fb3b3",
      "terminal.ansiGreen": "#99c794",
      "terminal.ansiMagenta": "#c695c6",
      "terminal.ansiRed": "#ec5f67",
      "terminal.ansiWhite": "#d8dee9",
      "terminal.ansiYellow": "#fac863",
      "terminal.background": "#1b2b34",
      "terminal.border": "#80cbc430",
      "terminal.foreground": "#d8dee9",
      "terminal.selectionBackground": "#607d8b50",
      "terminalCursor.foreground": "#f9ae58",
      "textBlockQuote.background": "#1b2b34",
      "textBlockQuote.border": "#1b2b34",
      "textCodeBlock.background": "#273942",
      "textLink.activeForeground": "#d8dee9",
      "textLink.foreground": "#80cbc4",
      "titleBar.activeBackground": "#1b2b34",
      "titleBar.activeForeground": "#d8dee9",
      "titleBar.border": "#1b2b3400",
      "titleBar.inactiveBackground": "#263238",
      "titleBar.inactiveForeground": "#607d8b",
      "walkThrough.embeddedEditorBackground": "#273942",
      "welcomePage.background": "#273942",
      "welcomePage.buttonBackground": "#1b2b34",
      "welcomePage.buttonHoverBackground": "#607d8b20",
      "widget.shadow": "#1b2b3450"
      
    },
    "tokenColors": [
      {
        "scope": "comment",
        "settings": {
          "foreground": "#4E5D65"
        }
      },
      {
        "scope": "constant",
        "settings": {
          "foreground": "#D8DEE9"
        }
      },
      {
        "scope": "constant.numeric",
        "settings": {
          "foreground": "#FAC863"
        }
      },
      {
        "scope": "constant.character",
        "settings": {
          "foreground": "#CDDC39"
        }
      },
      {
        "scope": "constant.character.escape",
        "settings": {
          "foreground": "#C695C6"
        }
      },
      {
        "scope": "constant.language",
        "settings": {
          "foreground": "#EC5F67",
          "fontStyle": "italic"
        }
      },
      {
        "scope": "constant.other",
        "settings": {
          "foreground": "#6699CC"
        }
      },
      {
        "scope": "entity.name",
        "settings": {
          "foreground": "#6699CC"
        }
      },
      {
        "scope": "entity.name.type",
        "settings": {
          "foreground": "#6699CC",
          "fontStyle": "italic"
        }
      },
      {
        "scope": "entity.name.function",
        "settings": {
          "foreground": "#5FB3B3"
        }
      },
      {
        "scope": [
          "meta.function-call entity.name.function",
          "meta.function-call"
        ],
        "settings": {
          "foreground": "#6699CC"
        }
      },
      {
        "scope": "meta.function-call.arguments",
        "settings": {
          "foreground": "#D8DEE9"
        }
      },
      {
        "scope": "entity.name.tag",
        "settings": {
          "foreground": "#EC5F67"
        }
      },
      {
        "scope": "entity.name.section",
        "settings": {}
      },
      {
        "scope": "entity.name.type.class",
        "settings": {
          "foreground": "#F9AE58",
          "fontStyle": ""
        }
      },
      {
        "scope": "entity.other.inherited-class",
        "settings": {
          "foreground": "#6699CC",
          "fontStyle": "italic"
        }
      },
      {
        "scope": "entity.other.attribute-name",
        "settings": {
          "foreground": "#C695C6"
        }
      },
      {
        "scope": "punctuation",
        "settings": {
          "foreground": "#AFBDC4"
        }
      },
      {
        "scope": "punctuation.accessor",
        "settings": {
          "foreground": "#F98757"
        }
      },
      {
        "scope": "punctuation.separator",
        "settings": {
          "foreground": "#F98757"
        }
      },
      {
        "scope": "punctuation.definition.comment",
        "settings": {
          "foreground": "#4E5D65"
        }
      },
      {
        "scope": "punctuation.definition.keyword",
        "settings": {
          "foreground": "#C695C6"
        }
      },
      {
        "scope": "punctuation.section",
        "settings": {
          "foreground": "#5FB3B3"
        }
      },
      {
        "scope": "punctuation.definition",
        "settings": {
          "foreground": "#5FB3B3"
        }
      },
      {
        "scope": "punctuation.definition.variable",
        "settings": {
          "foreground": "#D8DEE9"
        }
      },
      {
        "scope": "keyword.control",
        "settings": {
          "foreground": "#C695C6"
        }
      },
      {
        "scope": [
          "keyword.control.import",
          "keyword.control.export",
          "keyword.control.from"
        ],
        "settings": {
          "foreground": "#80CBC4"
        }
      },
      {
        "scope": "keyword.operator",
        "settings": {
          "foreground": "#5FB3B3"
        }
      },
      {
        "scope": "keyword.other",
        "settings": {
          "foreground": "#EC5F67"
        }
      },
      {
        "scope": "storage.type",
        "settings": {
          "foreground": "#C695C6"
        }
      },
      {
        "scope": "storage.modifier",
        "settings": {
          "foreground": "#C695C6"
        }
      },
      {
        "scope": "string.quoted",
        "settings": {
          "foreground": "#99C794"
        }
      },
      {
        "scope": "string.quoted.triple",
        "settings": {
          "foreground": "#5FB3B3"
        }
      },
      {
        "scope": "string.unquoted.interpolated",
        "settings": {
          "foreground": "#C695C6"
        }
      },
      {
        "scope": "string.unquoted.regexp",
        "settings": {
          "foreground": "#EC5F67"
        }
      },
      {
        "scope": "string.template",
        "settings": {
          "foreground": "#C695C6"
        }
      },
      {
        "scope": "support.function",
        "settings": {
          "foreground": "#EC5F67"
        }
      },
      {
        "scope": "support.class",
        "settings": {
          "foreground": "#EC5F67",
          "fontStyle": "italic"
        }
      },
      {
        "scope": "support.type",
        "settings": {
          "foreground": "#EC5F67",
          "fontStyle": "italic"
        }
      },
      {
        "scope": "support.constant",
        "settings": {
          "foreground": "#EC5F67"
        }
      },
      {
        "scope": "support.variable",
        "settings": {
          "foreground": "#EC5F67"
        }
      },
      {
        "scope": "support.other",
        "settings": {
          "foreground": "#EC5F67"
        }
      },
      {
        "scope": "variable.language",
        "settings": {
          "foreground": "#EC5F67",
          "fontStyle": "italic"
        }
      },
      {
        "scope": "variable.parameter",
        "settings": {
          "foreground": "#F9AE58"
        }
      },
      {
        "scope": "variable.other",
        "settings": {
          "foreground": "#D8DEE9"
        }
      },
      {
        "scope": "variable.other.constant.property",
        "settings": {
          "foreground": "#99C794"
        }
      },
      {
        "scope": "variable.object.property",
        "settings": {
          "foreground": "#5FB3B3"
        }
      },
      {
        "scope": "meta.object-literal.key",
        "settings": {
          "foreground": "#5FB3B3"
        }
      },
      {
        "scope": "token.info-token",
        "settings": {
          "foreground": "#6796E6"
        }
      },
      {
        "scope": "token.warn-token",
        "settings": {
          "foreground": "#CD9731"
        }
      },
      {
        "scope": "token.error-token",
        "settings": {
          "foreground": "#F44747"
        }
      },
      {
        "scope": "token.debug-token",
        "settings": {
          "foreground": "#B267E6"
        }
      }
    ]
  }`);
  const { useMonacoEffect } = useMonacoContext();
  const model = useTextModel({
    path: 'theme.json',
    defaultContents: theme,
  });

  useMonacoEffect(
    (monaco) => {
      let val;
      try {
        val = parseJSONWithComments(theme);
      } catch (e) {
        console.warn(e);
        val = 'vs-dark';
      }
      monaco.editor.setTheme(val);
    },
    [theme]
  );

  const { containerRef } = useEditor({
    model,
    options: {
      formatOnSave: true, // a
    },
    onChange: (v) => setTheme(v),
  });

  const [v, setv] = React.useState(true);
  return (
    <div>
      <div className="App">
        <h1>use-monaco with graphql</h1>
        <button onClick={() => setv((o) => !o)}>Hide</button>
      </div>
      {v && <div ref={containerRef} style={{ height: 500, width: 500 }}></div>}
    </div>
  );
}

export default withMonaco(
  {
    theme: null,
    workersPath: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000' + '/_next/static/workers',
    languagesPath: '/languages/',
    languages: ['json'],
    plugins: [plugins.prettier(), plugins.textmate(), plugins.vscodeThemes()],
  },
  App
);
