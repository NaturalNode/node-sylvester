/**
 * One Node in a linked list.
 */
export class Node<T> {
  constructor(public readonly data: T, public prev: Node<T>, public  next: Node<T>) {}
}

const defaultEquality = (a: unknown, b: unknown) => a === b;

export interface IImmutableList<T> {
  /**
   * Linked list length.
   */
  readonly length: number;

  /**
   * First node.
   */
  readonly first: Readonly<Node<T>> | null;

  /**
   * Last node.
   */
  readonly last: Readonly<Node<T>> | null;

  /**
   * Returns the node at the given index. It is circular, so it wraps around
   * if out of bounds.
   */
  at(index: number): Readonly<Node<T>> | null;
  /**
   * Returns a new list created by applying the predicate function.
   */
  filter(predicate: (node: Readonly<Node<T>>, index: number) => boolean): IImmutableList<T>;

  /**
   * Gets a node from its containing data.
   */
  findNode<T2 = T>(data: T2, equalityCheck: (a: T, b: T2) => boolean): Readonly<Node<T>> | null;

  /**
   * Returns a new linked list formed by mapping this list's items.
   */
  map<R>(transformation: (data: T, index: number) => R): IImmutableList<R>;

  /**
   * Runs the function for every item in the list.
   */
  forEach(fn: (node: Readonly<Node<T>>, index: number) => void): void;

  /**
   * Returns whether the predicate returns true for any item in the list.
   * @param {function(data: Node, index: number): boolean} predicate
   * @returns {Boolean}
   */
  some(predicate: (data: Readonly<Node<T>>, index: number) => boolean): boolean;

  /**
   * Converts the linked list to an array.
   * @returns {Array}
   */
  toArray(): T[];
}

/**
 * Circular linked list. All operations are constant-time.
 */
export class CircularLinkedList<T> implements IImmutableList<T> {
  /**
   * @inheritdoc
   */
  public length = 0;

  /**
   * @inheritdoc
   */
  public first: Node<T> | null = null;

  /**
   * @inheritdoc
   */
  public last: Node<T> | null = null;

  /**
   * @inheritdoc
   */
  public at(index: number) {
    if (this.length === 0) {
      return null;
    }

    if (index >= this.length) {
      index %= this.length;
    }

    let node = this.first!;
    while (index--) {
      node = node.next!;
    }

    return node;
  }

  /**
   * Adds a new node to the head of the list.
   */
  public append(data: T) {
    if (this.first === null || this.last === null) {
      const node = new Node(data, null as any, null as any);
      this.first = this.last = node.next = node.prev = node;
    } else {
      const node = new Node(data, this.last, this.first)
      this.last.next = node;
      this.first.prev = node;
      this.last = node;
    }
    this.length++;
  }

  /**
   * Prepends a new node to the head of the list.
   * @param {Node} node
   */
  public prepend(data: T) {
    if (this.first === null || this.last === null) {
      this.append(data);
      return;
    }


    const node = new Node(data, this.last, this.first);
    this.first.prev = node;
    this.last.next = node;
    this.first = node;
    this.length++;
  }

  /**
   * Inserts the node after the given node.
   */
  public insertAfter(node: Node<T>, newNode: Node<T>) {
    newNode.prev = node;
    newNode.next = node.next;
    if (node.next) {
      node.next.prev = newNode;
    }

    node.next = newNode;
    if (newNode.prev === this.last) {
      this.last = newNode;
    }
    this.length++;
  }

  /**
   * Inserts the node before the given node.
   */
  public insertBefore(node: Node<T>, newNode: Node<T>) {
    newNode.prev = node.prev;
    newNode.next = node;
    if (node.prev) {
      node.prev.next = newNode;
    }

    node.prev = newNode;
    if (newNode.next === this.first) {
      this.first = newNode;
    }
    this.length++;
  }

  /**
   * @inheritdoc
   */
  public filter(predicate: (node: Node<T>, index: number) => boolean): IImmutableList<T> {
    const linked = new CircularLinkedList<T>();
    let node = this.first!;
    for (let i = 0; i < this.length; i++) {
      if (predicate(node, i)) {
        linked.append(node.data);
      }
      node = node.next!;
    }

    return linked;
  }

  /**
   * Gets a node from its containing data.
   * @param {*} data
   * @param {function(item: *): boolean} equalityCheck
   * @returns {Node|null} The node that was removed
   */
  public findNode<T2>(
    data: T2,
    equalityCheck: (a: T, b: T2) => boolean = defaultEquality,
  ): Readonly<Node<T>> | null {
    let nodeFromStart = this.first!;
    let nodeFromEnd = this.last!;
    let n = Math.ceil(this.length / 2);
    while (n--) {
      if (equalityCheck(nodeFromStart.data, data)) {
        return nodeFromStart;
      }
      if (equalityCheck(nodeFromEnd.data, data)) {
        return nodeFromEnd;
      }
      nodeFromStart = nodeFromStart.next!;
      nodeFromEnd = nodeFromEnd.prev!;
    }

    return null;
  }

  /**
   * Returns a new linked list formed by mapping this list's items.
   * @param {function(data: Node, index: number)} items
   * @returns {CircularLinkedList}
   */
  public map<R>(transformation: (data: T, index: number) => R): CircularLinkedList<R> {
    const linked = new CircularLinkedList<R>();
    let node = this.first!;
    for (let i = 0; i < this.length; i++) {
      linked.append(transformation(node.data, i));
      node = node.next!;
    }

    return linked;
  }

  /**
   * Runs the function for every item in the list.
   * @param {function(data: Node, index: number): void} fn
   */
  public forEach(fn: (node: Node<T>, index: number) => void) {
    if (!this.first) {
      return;
    }

    let node = this.first;
    for (let i = 0; i < this.length; i++) {
      fn(node, i);
      node = node.next!;
    }
  }

  /**
   * Returns whether the predicate returns true for any item in the list.
   * @param {function(data: Node, index: number): boolean} predicate
   * @returns {Boolean}
   */
  public some(predicate: (data: Node<T>, index: number) => boolean): boolean {
    let node = this.first!;
    for (let i = 0; i < this.length; i++) {
      if (predicate(node, i)) {
        return true;
      }

      node = node.next!;
    }

    return false;
  }

  /**
   * @inheritdoc
   */
  public toArray(): T[] {
    const arr = new Array(this.length);
    let node = this.first!;
    for (let i = 0; i < this.length; i++) {
      arr[i] = node.data;
      node = node.next!;
    }

    return arr;
  }

  /**
   * Returns a linked list from the array.
   * @param {Array} list
   * @returns {CircularLinkedList}
   */
  public static fromArray<T>(list: ReadonlyArray<Node<T> | T>): CircularLinkedList<T> {
    const linked = new CircularLinkedList<T>();
    let n = list.length;
    while (n--) {
      const item = list[n];
      linked.prepend(item instanceof Node ? item.data : item);
    }

    return linked;
  }
}
