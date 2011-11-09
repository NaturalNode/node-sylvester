
var sylvester = require('../lib/node-sylvester'),
Vector = sylvester.Vector;

var x = Vector.create([1, 2, 3]);

describe('vector', function() {
    it('should log', function() {
	expect(x.log()).toEqual($V([0, 0.6931471805599453, 1.0986122886681098]));
    });

    it('should dot product', function() {
	expect(x.dot(Vector.create([2, 3, 4]))).toBe(20);
    });

    it('should support removal of head positions', function() {
	expect(x.chomp(1)).toEqual($V([2, 3]));
    });

    it('should sum', function() {
	expect(x.sum()).toBe(6);
    });

    it('should support addition of elements on the right side', function() {
	expect(x.augment([4, 5])).toEqual($V([1, 2, 3, 4, 5]));
    })

    it('should create with $V', function() {
	var a = $V([2, 3, 4]);
	var b = Vector.create([2, 3, 4]);
	expect(a).toEqual(b);
    });
});
