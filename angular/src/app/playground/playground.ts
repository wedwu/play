import { Component, signal, ElementRef, ViewChild } from '@angular/core';

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
  const { archiveVersion, ...rest } = arr2.find(i => i.id === item.archiveId) ?? {};
  return { ...item, ...rest };
});

console.log(JSON.stringify(combined, null, 2));
`;

export type OutputLine = { type: 'log' | 'error'; text: string };

@Component({
  selector: 'app-playground',
  templateUrl: './playground.html',
  styleUrl: './playground.scss',
})
export class Playground {
  @ViewChild('editor') editorRef!: ElementRef<HTMLTextAreaElement>;

  code = signal(DEFAULT_CODE);
  output = signal<OutputLine[]>([]);
  hasRun = signal(false);

  runCode() {
    const lines: OutputLine[] = [];
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: unknown[]) => {
      lines.push({
        type: 'log',
        text: args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' '),
      });
      originalLog(...args);
    };
    console.error = (...args: unknown[]) => {
      lines.push({
        type: 'error',
        text: args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' '),
      });
      originalError(...args);
    };

    try {
      new Function(this.code())();
    } catch (err) {
      lines.push({ type: 'error', text: String(err) });
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }

    this.output.set(lines);
    this.hasRun.set(true);
  }

  clearOutput() {
    this.output.set([]);
    this.hasRun.set(false);
  }

  handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      this.runCode();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = this.editorRef.nativeElement;
      const { selectionStart, selectionEnd } = el;
      const next =
        this.code().substring(0, selectionStart) + '  ' + this.code().substring(selectionEnd);
      this.code.set(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 2;
      });
    }
  }
}
