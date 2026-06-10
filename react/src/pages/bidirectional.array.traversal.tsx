// ============================================
// 1. BIDIRECTIONAL ITERATOR CLASS
// ============================================
class BidirectionalIterator<T> {
  #index = 0;
  readonly #array: readonly T[];

  constructor(array: readonly T[]) {
    this.#array = array;
  }

  get currentIndex(): number {
    return this.#index;
  }

  // Move forward
  next(): IteratorResult<T> {
    if (this.#index < this.#array.length) {
      return { value: this.#array[this.#index++], done: false };
    }
    return { value: undefined, done: true };
  }

  // Move backward
  previous(): IteratorResult<T> {
    if (this.#index > 0) {
      return { value: this.#array[--this.#index], done: false };
    }
    return { value: undefined, done: true };
  }

  // Reset to beginning
  reset(): void {
    this.#index = 0;
  }

  // Get current value without moving
  peek(): T | undefined {
    return this.#array[this.#index];
  }

  // Move to specific index
  seek(index: number): T | undefined {
    if (index >= 0 && index < this.#array.length) {
      this.#index = index;
      return this.#array[index];
    }
    return undefined;
  }

  // Native iteration protocol — enables for...of and spread
  [Symbol.iterator](): Iterator<T> {
    return { next: () => this.next() };
  }
}

// Usage:
const arr = [10, 20, 30, 40, 50];
const iterator = new BidirectionalIterator(arr);

console.log("Forward traversal:");
console.log(iterator.next()); // { value: 10, done: false }
console.log(iterator.next()); // { value: 20, done: false }
console.log(iterator.next()); // { value: 30, done: false }

console.log("Backward traversal:");
console.log(iterator.previous()); // { value: 20, done: false }
console.log(iterator.previous()); // { value: 10, done: false }


// ============================================
// 2. DOUBLE-ENDED QUEUE (DEQUE) - FAST OPS
// ============================================
class Deque {
  constructor() {
    this.items = {};
    this.count = 0;
    this.lowestCount = 0;
  }

  // Add to front
  addFront(element) {
    if (this.count === this.lowestCount) {
      this.items[this.count] = element;
      this.count++;
    } else {
      this.lowestCount--;
      this.items[this.lowestCount] = element;
    }
  }

  // Add to back
  addBack(element) {
    this.items[this.count] = element;
    this.count++;
  }

  // Remove from front
  removeFront() {
    if (this.lowestCount === this.count) return undefined;
    const result = this.items[this.lowestCount];
    delete this.items[this.lowestCount];
    this.lowestCount++;
    return result;
  }

  // Remove from back
  removeBack() {
    if (this.lowestCount === this.count) return undefined;
    const result = this.items[this.count - 1];
    delete this.items[this.count - 1];
    this.count--;
    return result;
  }

  // Peek front
  peekFront() {
    return this.items[this.lowestCount];
  }

  // Peek back
  peekBack() {
    return this.items[this.count - 1];
  }

  // Get size
  size() {
    return this.count - this.lowestCount;
  }

  // Traverse forward
  traverseForward(callback) {
    for (let i = this.lowestCount; i < this.count; i++) {
      callback(this.items[i], i - this.lowestCount);
    }
  }

  // Traverse backward
  traverseBackward(callback) {
    for (let i = this.count - 1; i >= this.lowestCount; i--) {
      callback(this.items[i], this.count - 1 - i);
    }
  }
}

// Usage:
const deque = new Deque();
deque.addBack(1);
deque.addBack(2);
deque.addBack(3);
deque.addFront(0);

console.log("\nDeque forward:");
deque.traverseForward((val, idx) => console.log(`Index ${idx}: ${val}`));

console.log("Deque backward:");
deque.traverseBackward((val, idx) => console.log(`Index ${idx}: ${val}`));


// ============================================
// 3. TWO-POINTER APPROACH (Very Fast)
// ============================================
function twoPointerTraversal(array, callback) {
  let left = 0;
  let right = array.length - 1;

  while (left < right) {
    // Process left side
    callback('forward', array[left], left);
    // Process right side
    callback('backward', array[right], right);
    left++;
    right--;
  }

  // Handle middle element if array length is odd
  if (left === right) {
    callback('middle', array[left], left);
  }
}

// Usage:
console.log("\nTwo-pointer traversal:");
twoPointerTraversal([1, 2, 3, 4, 5], (direction, value, index) => {
  console.log(`${direction.padEnd(8)}: index=${index}, value=${value}`);
});


// ============================================
// 4. CALLBACK-BASED BIDIRECTIONAL TRAVERSAL
// ============================================
function traverseBothDirections(array, onForward, onBackward) {
  // Forward
  for (let i = 0; i < array.length; i++) {
    onForward(array[i], i);
  }

  // Backward
  for (let i = array.length - 1; i >= 0; i--) {
    onBackward(array[i], i);
  }
}

// Usage:
console.log("\nCallback-based approach:");
traverseBothDirections(
  ['a', 'b', 'c'],
  (val, idx) => console.log(`Forward[${idx}]:`, val),
  (val, idx) => console.log(`Backward[${idx}]:`, val)
);


// ============================================
// 5. GENERATOR-BASED BIDIRECTIONAL ITERATION
// ============================================
function* bidirectionalGenerator(array, startIndex = 0) {
  // Forward from start
  for (let i = startIndex; i < array.length; i++) {
    yield { direction: 'forward', value: array[i], index: i };
  }

  // Backward to start
  for (let i = startIndex; i >= 0; i--) {
    yield { direction: 'backward', value: array[i], index: i };
  }
}

// Usage:
console.log("\nGenerator approach:");
for (const item of bidirectionalGenerator([10, 20, 30], 1)) {
  console.log(`${item.direction.padEnd(8)}: [${item.index}] = ${item.value}`);
}


// ============================================
// 6. PERFORMANCE TEST
// ============================================
console.log("\n=== PERFORMANCE TEST ===");
const largeArray = Array.from({ length: 1000000 }, (_, i) => i);

// Test Iterator
console.time('Iterator');
const iter = new BidirectionalIterator(largeArray);
while (iter.currentIndex < largeArray.length) iter.next();
while (iter.currentIndex > 0) iter.previous();
console.timeEnd('Iterator');

// Test Deque
console.time('Deque');
const dq = new Deque();
largeArray.forEach(val => dq.addBack(val));
dq.traverseForward(() => {});
dq.traverseBackward(() => {});
console.timeEnd('Deque');

// Test Two-pointer
console.time('Two-pointer');
let left = 0, right = largeArray.length - 1;
while (left < right) { left++; right--; }
console.timeEnd('Two-pointer');

// Test native loops
console.time('Native loops');
for (let i = 0; i < largeArray.length; i++) {}
for (let i = largeArray.length - 1; i >= 0; i--) {}
console.timeEnd('Native loops');