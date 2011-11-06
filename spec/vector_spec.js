
var sylvester = require('../lib/node-sylvester'),
Vector = sylvester.Vector;

describe('vector', function() {
    it('should dot product', function() {
	var x = Vector.create([1, 2, 3]);
	expect(x.dot(Vector.create([2, 3, 4]))).toBe(20);
    });

    it('should create with $V', function() {
	var a = $V([2, 3, 4]);
	var b = Vector.create([2, 3, 4]);
	expect(a).toEqual(b);
    });
});
