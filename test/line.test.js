import { Line } from '../src';
import { expect } from 'chai';

describe('line', () => {
    it('should create', () => {
        const line = Line.create([1, 2], [5, 6]);
        expect(line.anchor).to.vector.equal([1, 2, 0]);
    })
});
