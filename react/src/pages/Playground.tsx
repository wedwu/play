import { useState, useRef } from "react";

const DEFAULT_CODE = `const arr1 = [
  {
    archiveId: "f3cd73a6-c856-4b09-a223-2bdb1d88046c",
    archiveVersion: 179,
    timestamp: "2026-04-01T11:23:00.9836459-04:00",
    author: "root",
    comment: "Ap-ci"
  },
  {
    archiveId: "f3cd73a6-c856-4b09-a223-2bdb1d88046c",
    archiveVersion: 178,
    timestamp: "2026-03-30T14:25:42.5499229-04:00",
    author: "root",
    comment: " Archive ci"
  }
];

const arr2 = [
  {
    id: "f3cd73a6-c856-4b09-a223-2bdb1d88046c",
    name: "aex",
    archiveVersion: 179,
    isDeployed: true,
    attraction: {
      site: "W",
      displaySite: "Resort",
      park: "K",
      displayPark: "Ma",
      name: "h",
      code: "123",
      id: 456,
      defaultLanguage: "en-US"
    }
  }
];

const combined = arr1.map(item => {
  const match = arr2.find(i => i.id === item.archiveId);
  if (!match) return item;
  const entries = Object.entries(match);
  const matchVersion = entries.find(([k]) => k === 'archiveVersion')?.[1];
  const rest = Object.fromEntries(entries.filter(([k]) => k !== 'archiveVersion'));
  const d = new Date(item.timestamp);
  const pad = n => String(n).padStart(2, '0');
  const timestamp = pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  return { ...item, ...rest, isDeployed: item.archiveVersion === matchVersion, timestamp };
});

console.log(JSON.stringify(combined, null, 2));
`;

type OutputLine = { type: "log" | "error"; text: string };

const Playground = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runCode = () => {
    const lines: OutputLine[] = [];

    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: unknown[]) => {
      lines.push({
        type: "log",
        text: args.map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2))).join(" "),
      });
      originalLog(...args);
    };
    console.error = (...args: unknown[]) => {
      lines.push({
        type: "error",
        text: args.map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2))).join(" "),
      });
      originalError(...args);
    };

    try {
      new Function(code)();
    } catch (err) {
      lines.push({ type: "error", text: String(err) });
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }

    setOutput(lines);
    setHasRun(true);
  };

  const clearOutput = () => {
    setOutput([]);
    setHasRun(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = textareaRef.current!;
      const { selectionStart, selectionEnd } = el;
      const next = code.substring(0, selectionStart) + "  " + code.substring(selectionEnd);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 2;
      });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>JS Playground</h2>
        <div style={styles.actions}>
          <span style={styles.hint}>⌘ + Enter to run</span>
          <button style={styles.clearBtn} onClick={clearOutput}>
            Clear
          </button>
          <button style={styles.runBtn} onClick={runCode}>
            Run
          </button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.editorPane}>
          <div style={styles.paneLabel}>Code</div>
          <textarea
            ref={textareaRef}
            style={styles.editor}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        <div style={styles.outputPane}>
          <div style={styles.paneLabel}>Output</div>
          <div style={styles.output}>
            {!hasRun && <span style={styles.placeholder}>Run your code to see output...</span>}
            {output.length === 0 && hasRun && <span style={styles.placeholder}>No output</span>}
            {output.map((line, i) => (
              <pre key={i} style={line.type === "error" ? styles.errorLine : styles.logLine}>
                {line.text}
              </pre>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#1e1e1e",
    color: "#d4d4d4",
    fontFamily: "monospace",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "#2d2d2d",
    borderBottom: "1px solid #3c3c3c",
  },
  title: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#cccccc",
    fontFamily: "sans-serif",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  hint: {
    fontSize: "11px",
    color: "#666",
    fontFamily: "sans-serif",
  },
  runBtn: {
    padding: "5px 16px",
    background: "#0e7a0d",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "sans-serif",
  },
  clearBtn: {
    padding: "5px 12px",
    background: "#3c3c3c",
    color: "#ccc",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "sans-serif",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  editorPane: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    borderRight: "1px solid #3c3c3c",
  },
  outputPane: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  paneLabel: {
    padding: "4px 12px",
    fontSize: "11px",
    color: "#888",
    background: "#252525",
    borderBottom: "1px solid #3c3c3c",
    fontFamily: "sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  editor: {
    flex: 1,
    background: "#1e1e1e",
    color: "#d4d4d4",
    border: "none",
    outline: "none",
    padding: "16px",
    fontSize: "13px",
    lineHeight: "1.6",
    resize: "none",
    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    tabSize: 2,
  },
  output: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    background: "#1e1e1e",
    textAlign: "start",
  },
  placeholder: {
    color: "#555",
    fontSize: "13px",
    fontFamily: "sans-serif",
  },
  logLine: {
    margin: "0 0 4px",
    fontSize: "13px",
    color: "#d4d4d4",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  errorLine: {
    margin: "0 0 4px",
    fontSize: "13px",
    color: "#f48771",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};
