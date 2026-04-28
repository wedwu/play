import { useState, useMemo } from "react";
import "./ArrayMergePlayground.css";

const DEFAULT_ARR1 = JSON.stringify(
  [
    {
      archiveId: "f3cd73a6-c856-4b09-a223-2bdb1d88046c",
      archiveVersion: 179,
      timestamp: "2026-04-01T11:23:00.9836459-04:00",
      author: "root",
      comment: "Ap-ci",
    },
    {
      archiveId: "f3cd73a6-c856-4b09-a223-2bdb1d88046c",
      archiveVersion: 178,
      timestamp: "2026-03-30T14:25:42.5499229-04:00",
      author: "root",
      comment: " Archive ci",
    },
  ],
  null,
  2
);

const DEFAULT_ARR2 = JSON.stringify(
  [
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
        defaultLanguage: "en-US",
      },
    },
  ],
  null,
  2
);

const mergeArrays = (arr1: unknown[], arr2: unknown[]): unknown[] => {
  return arr1.map((item) => {
    const record = item as Record<string, unknown>;
    const match = (arr2 as Record<string, unknown>[]).find((i) => i.id === record.archiveId);
    const merged = { ...(match ?? {}) };
    delete merged.archiveVersion;
    return { ...record, ...merged };
  });
};

const ArrayMergePlayground = () => {
  const [input1, setInput1] = useState(DEFAULT_ARR1);
  const [input2, setInput2] = useState(DEFAULT_ARR2);

  const { result, error } = useMemo(() => {
    try {
      const arr1 = JSON.parse(input1);
      const arr2 = JSON.parse(input2);
      if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
        return { result: null, error: "Both inputs must be JSON arrays" };
      }
      return { result: mergeArrays(arr1, arr2), error: null };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input1, input2]);

  return (
    <section className="playground">
      <h2>Array Merge Playground</h2>
      <p className="playground-desc">
        Merges two arrays by matching <code>archiveId</code> → <code>id</code>,
        <code>archiveVersion</code> from arr1.
      </p>

      <div className="playground-inputs">
        <div className="playground-panel">
          <label htmlFor="arr1">Array 1 (archive history)</label>
          <textarea
            id="arr1"
            value={input1}
            onChange={(e) => setInput1(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="playground-panel">
          <label htmlFor="arr2">Array 2 (archive metadata)</label>
          <textarea
            id="arr2"
            value={input2}
            onChange={(e) => setInput2(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="playground-output">
        <label>Result</label>
        {error ? (
          <pre className="playground-error">{error}</pre>
        ) : (
          <pre className="playground-result">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </section>
  );
};

export default ArrayMergePlayground;
