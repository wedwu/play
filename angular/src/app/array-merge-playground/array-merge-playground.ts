import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const DEFAULT_ARR1 = JSON.stringify(
  [
    {
      archiveId: 'f3cd73a6-c856-4b09-a223-2bdb1d88046c',
      archiveVersion: 179,
      timestamp: '2026-04-01T11:23:00.9836459-04:00',
      author: 'root',
      comment: 'Ap-ci',
    },
    {
      archiveId: 'f3cd73a6-c856-4b09-a223-2bdb1d88046c',
      archiveVersion: 178,
      timestamp: '2026-03-30T14:25:42.5499229-04:00',
      author: 'root',
      comment: ' Archive ci',
    },
  ],
  null,
  2,
);

const DEFAULT_ARR2 = JSON.stringify(
  [
    {
      id: 'f3cd73a6-c856-4b09-a223-2bdb1d88046c',
      name: 'aex',
      archiveVersion: 179,
      isDeployed: true,
      attraction: {
        site: 'W',
        displaySite: 'Resort',
        park: 'K',
        displayPark: 'Ma',
        name: 'h',
        code: '123',
        id: 456,
        defaultLanguage: 'en-US',
      },
    },
  ],
  null,
  2,
);

const mergeArrays = (arr1: Record<string, unknown>[], arr2: Record<string, unknown>[]) => {
  return arr1.map((item) => {
    const match = arr2.find((i) => i['id'] === item['archiveId']);
    const merged = { ...(match ?? {}) };
    delete merged['archiveVersion'];
    return { ...item, ...merged };
  });
};

@Component({
  selector: 'app-array-merge-playground',
  imports: [FormsModule],
  templateUrl: './array-merge-playground.html',
  styleUrl: './array-merge-playground.scss',
})
export class ArrayMergePlayground {
  input1 = signal(DEFAULT_ARR1);
  input2 = signal(DEFAULT_ARR2);

  result = computed(() => {
    try {
      const arr1 = JSON.parse(this.input1());
      const arr2 = JSON.parse(this.input2());
      if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
        return { data: null, error: 'Both inputs must be JSON arrays' };
      }
      return { data: mergeArrays(arr1, arr2), error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  });

  resultJson = computed(() => {
    const { data } = this.result();
    return data ? JSON.stringify(data, null, 2) : null;
  });
}
