import { expect } from 'chai';
import { Vector } from '../src';

const x = Vector.create([1, 2, 3]);

describe('vector', () => {
  it('should norm', () => {
    expect(Vector.create([1, 2, 3]).norm()).to.equal(3.7416573867739413);
  });

  it('should log', () => {
    expect(x.log()).to.vector.equal([0, 0.6931471805599453, 1.0986122886681098]);
  });

  it('should dot product', () => {
    expect(x.dot(Vector.create([2, 3, 4]))).to.equal(20);
  });

  it('should support removal of head positions', () => {
    expect(x.chomp(1)).to.vector.equal([2, 3]);
  });

  it('should sum', () => {
    expect(x.sum()).to.equal(6);
  });

  it('should support addition of elements on the right side', () => {
    expect(x.augment([4, 5])).to.vector.equal([1, 2, 3, 4, 5]);
  });

  it('show allow for scalar addition', () => {
    const a = Vector.create([2, 3, 4]);
    const b = a.add(1);
    expect(b).to.vector.equal([3, 4, 5]);
  });

  it('show add', () => {
    const a = Vector.create([2, 3, 4]);
    const b = a.add(Vector.create([2, 4, 8]));
    expect(b).to.vector.equal([undefined, 7, 12]);
  });
});
