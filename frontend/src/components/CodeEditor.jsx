import React from "react";
import Editor from "@monaco-editor/react";

function mapMonacoLanguage(language) {
  const languages = {
    javascript: "javascript",
    html: "html",
    css: "css",
    java: "java",
    python: "python",
    csharp: "csharp",
    sql: "sql"
  };

  return languages[language] || "javascript";
}

function getLanguageLabel(language) {
  const labels = {
    javascript: "JavaScript",
    html: "HTML",
    css: "CSS",
    java: "Java",
    python: "Python",
    csharp: "C#",
    sql: "SQL"
  };

  return labels[language] || "Codigo";
}

function CodeEditor({
  language = "javascript",
  value = "",
  onChange,
  height = "320px",
  title,
  subtitle
}) {
  return (
    <div className="code-editor-card">
      {(title || subtitle) && (
        <div className="code-editor-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>

          <span className="language-badge">{getLanguageLabel(language)}</span>
        </div>
      )}

      <div className="monaco-box">
        <Editor
          height={height}
          defaultLanguage={mapMonacoLanguage(language)}
          language={mapMonacoLanguage(language)}
          theme="vs-dark"
          value={value}
          onChange={(newValue) => onChange?.(newValue || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            renderLineHighlight: "all"
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
