import React from "react";
import { render } from "react-dom";
import { useMonacoEditor, prettier } from "use-monaco";
import themes from "use-monaco/themes";

function App() {
  const { containerRef } = useMonacoEditor({
    themes: themes,
    onLoad: monaco => {
      monaco.worker.register({
        label: "hello",
        languageId: "typescript",
        src: () => new Worker("./worker.js"),
        providers: {
          hover: true
        }
      });
    },
    path: "model.ts",
    plugins: [prettier(["typescript"])],
    options: {
      minimap: {
        enabled: false
      }
    },
    defaultValue: `
    function App() {
      const a = 1;
    }`,
    theme: "github"
  });
  return (
    <>
      <div ref={containerRef} style={{ width: 500, height: 500 }} />
    </>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
