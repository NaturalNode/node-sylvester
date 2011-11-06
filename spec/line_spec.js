
var Line = require('../lib/node-sylvester/line');
var Vector = require('../lib/node-sylvester/vector');

describe('line', function() {
    it('should create', function() {
	var line = Line.create([1, 2], [5, 6]);
	expect(line.anchor).toEqual(Vector.create([1, 2, 0]));
    })
});
