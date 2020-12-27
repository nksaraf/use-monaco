import * as monacoApi from "monaco-editor";
// import allThemes from "use-monaco/themes";

// export const darkTheme = {
//   ...allThemes["ayu-dark"],
//   colors: {
//     ...allThemes["ayu-dark"]["colors"],
//     // "editor.background": theme("colors", "blueGray.50"),
//   },
// };

export const lightTheme = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "", foreground: "555555" },
    { token: "invalid", foreground: "ff3333" },
    { token: "emphasis", fontStyle: "italic" },
    { token: "strong", fontStyle: "bold" },

    { token: "variable", foreground: "397D13" },
    { token: "variable.parameter", foreground: "397D13" },
    { token: "variable.predefined", foreground: "D2054E" },
    { token: "entity", foreground: "D2054E" },
    { token: "constant", foreground: "f08c36" },
    { token: "constant.language", foreground: "D47509" },
    { token: "constant.enum", foreground: "0B7FC7" },
    { token: "comment", foreground: "abb0b6", fontStyle: "italic" },
    { token: "number", foreground: "2882F9" },
    { token: "number.hex", foreground: "f08c36" },
    { token: "regexp", foreground: "4dbf99" },
    { token: "annotation", foreground: "B33086" },
    { token: "type.identifier", foreground: "CA9800" },
    { token: "type", foreground: "1F61A0" },

    { token: "delimiter", foreground: "555555" },
    { token: "delimiter.html", foreground: "555555" },
    { token: "delimiter.xml", foreground: "555555" },

    { token: "tag", foreground: "e7c547" },
    { token: "tag.id.jade", foreground: "e7c547" },
    { token: "tag.class.jade", foreground: "e7c547" },
    { token: "meta.scss", foreground: "e7c547" },
    { token: "metatag", foreground: "e7c547" },
    { token: "metatag.content.html", foreground: "D64292" },
    { token: "metatag.html", foreground: "e7c547" },
    { token: "metatag.xml", foreground: "e7c547" },
    { token: "metatag.php", fontStyle: "bold" },

    { token: "key", foreground: "1F61A0" },
    { token: "string.key.json", foreground: "41a6d9" },
    { token: "string.value.json", foreground: "D64292" },

    { token: "attribute.name", foreground: "8B2BB9" },
    { token: "attribute.value", foreground: "0451A5" },
    { token: "attribute.value.number", foreground: "abb0b6" },
    { token: "attribute.value.unit", foreground: "D64292" },
    { token: "attribute.value.html", foreground: "D64292" },
    { token: "attribute.value.xml", foreground: "D64292" },

    { token: "string", foreground: "D64292" },
    { token: "string.html", foreground: "D64292" },
    { token: "string.sql", foreground: "D64292" },
    { token: "string.yaml", foreground: "D64292" },

    { token: "keyword", foreground: "B11A04" },
    { token: "keyword.json", foreground: "f2590c" },
    { token: "keyword.flow", foreground: "f2590c" },
    { token: "keyword.flow.scss", foreground: "f2590c" },

    { token: "operator.scss", foreground: "666666" }, //
    { token: "operator.sql", foreground: "778899" }, //
    { token: "operator.swift", foreground: "666666" }, //
    { token: "predefined.sql", foreground: "FF00FF" }, //
  ],
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#555555",
    "editorIndentGuide.background": "#ecebec",
    "editorIndentGuide.activeBackground": "#e0e0e0",
  },
} as monacoApi.editor.IStandaloneThemeData;
