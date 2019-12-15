/**
 * One Node in a linked list.
 */
export class Node {
  constructor(data) {
    this.data = data;

    /**
     * @type {Node}
     */
    this.prev = null;

    /**
     * @type {Node}
     */
    this.next = null;
  }
}

const defaultEquality = (a, b) => a === b;

/**
 * Circular linked list. All operations are constant-time.
 */
export class CircularLinkedList {
  constructor() {
    this.length = 0;
    /**
     * @type {Node}
     */
    this.first = null;
    /**
     * @type {Node}
     */
    this.last = null;
  }

  /**
   * Returns the node at the given index. It is circular, so it wraps around
   * if out of bounds.
   * @param {Number} index
   * @returns {Node|null}
   */
  at(index) {
    if (this.length === 0) {
      return null;
    }
    if (index >= this.length) {
      index %= this.length;
    }

    let node = this.first;
    while (index--) {
      node = node.next;
    }

    return node;
  }

  /**
   * Adds a new node to the head of the list.
   * @param {Node} node
   */
  append(node) {
    if (this.first === null) {
      node.prev = node;
      node.next = node;
      this.first = node;
      this.last = node;
    } else {
      node.prev = this.last;
      node.next = this.first;
      this.first.prev = node;
      this.last.next = node;
      this.last = node;
    }
    this.length++;
  }

  /**
   * Prepends a new node to the head of the list.
   * @param {Node} node
   */
  prepend(node) {
    if (this.first === null) {
      this.append(node);
      return;
    }

    node.prev = this.last;
    node.next = this.first;
    this.first.prev = node;
    this.last.next = node;
    this.first = node;
    this.length++;
  }

  /**
   * Inserts the node after the given node.
   * @param {Node} node
   * @param {Node} newNode
   */
  insertAfter(node, newNode) {
    newNode.prev = node;
    newNode.next = node.next;
    node.next.prev = newNode;
    node.next = newNode;
    if (newNode.prev === this.last) {
      this.last = newNode;
    }
    this.length++;
  }

  /**
   * Inserts the node before the given node.
   * @param {Node} node
   * @param {Node} newNode
   */
  insertBefore(node, newNode) {
    newNode.prev = node.prev;
    newNode.next = node;
    node.prev.next = newNode;
    node.prev = newNode;
    if (newNode.next === this.first) {
      this.first = newNode;
    }
    this.length++;
  }

  /**
   * Returns a new list created by applying the predicate function.
   * @param {function(node: Node, index: number): boolean} predicate
   * @returns {CircularLinkedList}
   */
  filter(predicate) {
    const linked = new CircularLinkedList();
    let node = this.first;
    for (let i = 0; i < this.length; i++) {
      if (predicate(node, i)) {
        linked.append(new Node(node.data));
      }
      node = node.next;
    }

    return linked;
  }

  /**
   * Gets a node from its containing data.
   * @param {*} data
   * @param {function(item: *): boolean} equalityCheck
   * @returns {Node|null} The node that was removed
   */
  findNode(data, equalityCheck = defaultEquality) {
    let nodeFromStart = this.first;
    let nodeFromEnd = this.last;
    let n = Math.ceil(this.length / 2);
    while (n--) {
      if (equalityCheck(nodeFromStart.data, data)) {
        return nodeFromStart;
      }
      if (equalityCheck(nodeFromEnd.data, data)) {
        return nodeFromEnd;
      }
      nodeFromStart = nodeFromStart.next;
      nodeFromEnd = nodeFromEnd.prev;
    }

    return null;
  }

  /**
   * Returns a new linked list formed by mapping this list's items.
   * @param {function(data: Node, index: number)} items
   * @returns {CircularLinkedList}
   */
  map(transformation) {
    const linked = new CircularLinkedList();
    let node = this.first;
    for (let i = 0; i < this.length; i++) {
      linked.append(new Node(transformation(node.data, i)));
      node = node.next;
    }

    return linked;
  }

  /**
   * Runs the function for every item in the list.
   * @param {function(data: Node, index: number): void} fn
   */
  forEach(fn) {
    let node = this.first;
    for (let i = 0; i < this.length; i++) {
      fn(node, i);
      node = node.next;
    }
  }

  /**
   * Returns whether the predicate returns true for any item in the list.
   * @param {function(data: Node, index: number): boolean} predicate
   * @returns {Boolean}
   */
  some(predicate) {
    let node = this.first;
    for (let i = 0; i < this.length; i++) {
      if (predicate(node, i)) {
        return true;
      }

      node = node.next;
    }

    return false;
  }

  /**
   * Converts the linked list to an array.
   * @returns {Array}
   */
  toArray() {
    const arr = new Array(this.length);
    let node = this.first;
    for (let i = 0; i < this.length; i++) {
      arr[i] = node.data;
      node = node.next;
    }

    return arr;
  }

  /**
   * Returns a linked list from the array.
   * @param {Array} list
   * @returns {CircularLinkedList}
   */
  static fromArray(list) {
    const linked = new CircularLinkedList();
    let n = list.length;
    while (n--) {
      const item = list[n];
      linked.prepend(item instanceof Node ? item : new Node(item));
    }

    return linked;
  }
}
