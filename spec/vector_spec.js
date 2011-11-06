
var Vector = require('../lib/node-sylvester/vector');

describe('vector', function() {
    it('should dot product', function() {
	var x = Vector.create([1, 2, 3]);
	expect(x.dot(Vector.create([2, 3, 4]))).toBe(20);
    });
});
