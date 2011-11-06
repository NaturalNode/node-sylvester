var Vector = require('../lib/node-sylvester/vector');
var Plane = require('../lib/node-sylvester/plane');

describe('plane', function() {
    it('should create', function() {
	var plane = Plane.create([1,2,3], [5, 5, 5]);
	expect(plane.anchor).toEqual(Vector.create([1, 2, 3]));
    });
});