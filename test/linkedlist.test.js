import { CircularLinkedList, Node } from '../src/linkedlist';
import { expect } from 'chai';

describe('linked list', () => {
  it('works when empty', () => {
    const ll = new CircularLinkedList();
    expect(ll.at(1)).to.be.null;
    expect(ll.length).to.equal(0);
    expect(ll.first).to.be.null;
    expect(ll.findNode(1)).to.be.null;
    ll.forEach(() => undefined);
    expect(ll.some(() => true)).to.be.false;
    expect(ll.toArray()).to.deep.equal([]);
  });

  it('appends and prepends elements', () => {
    const ll = new CircularLinkedList();
    ll.append(1);
    ll.append(2);
    ll.append(3);
    ll.prepend(4);
    ll.prepend(5);
    expect(ll.toArray()).to.deep.equal([5, 4, 1, 2, 3]);
  });

  it('creates from array', () => {
    const ll = CircularLinkedList.fromArray([new Node(1), 2, 3]);
    expect(ll.toArray()).to.deep.equal([1, 2, 3]);
  });

  it('gets at position', () => {
    const ll = CircularLinkedList.fromArray([1, 2, 3]);
    expect(ll.at(0).data).to.equal(1);
    expect(ll.at(1).data).to.equal(2);
    expect(ll.at(2).data).to.equal(3);
    expect(ll.at(3).data).to.equal(1);
  });

  it('gets by data', () => {
    const ll = CircularLinkedList.fromArray([1, 2, 3]);
    const node = ll.findNode(2);
    expect(node).to.be.ok;
    expect(node.next.data).to.equal(3);
    expect(node.prev.data).to.equal(1);
    expect(ll.findNode(42)).to.be.null;
  });

  it('filters', () => {
    let ll = CircularLinkedList.fromArray([0, 1, 2, 3]);
    ll = ll.filter(n => n.data !== 2);
    expect(ll.toArray()).to.deep.equal([0, 1, 3]);
    ll = ll.filter(n => n.data !== 3);
    expect(ll.toArray()).to.deep.equal([0, 1]);
    ll = ll.filter(n => n.data !== 0);
    expect(ll.toArray()).to.deep.equal([1]);
    ll = ll.filter(n => n.data !== 1);
    expect(ll.toArray()).to.deep.equal([]);
  });

  it('insertAfter', () => {
    const ll = CircularLinkedList.fromArray([1, 2, 3]);
    ll.insertAfter(ll.findNode(2), new Node(4));
    ll.insertAfter(ll.findNode(3), new Node(5));
    expect(ll.toArray()).to.deep.equal([1, 2, 4, 3, 5]);
  });

  it('insertBefore', () => {
    const ll = CircularLinkedList.fromArray([1, 2, 3]);
    ll.insertBefore(ll.findNode(2), new Node(4));
    ll.insertBefore(ll.findNode(1), new Node(5));
    expect(ll.toArray()).to.deep.equal([5, 1, 4, 2, 3]);
  });

  it('map', () => {
    const ll = CircularLinkedList.fromArray([1, 2, 3]).map(n => n * 2);
    expect(ll.toArray()).to.deep.equal([2, 4, 6]);
  });

  it('some', () => {
    const ll = CircularLinkedList.fromArray([1, 2, 3]);
    expect(ll.some(n => n.data === 2)).to.be.true;
    expect(ll.some(n => n.data === 42)).to.be.false;
  });

  it('forEach', () => {
    const out = [];
    CircularLinkedList.fromArray([1, 2, 3]).forEach(n => out.push(n.data));
    expect(out).to.deep.equal([1, 2, 3]);
  });
});
