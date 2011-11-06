
var Line = require('../lib/node-sylvester/line');
var LineSegment = require('../lib/node-sylvester/line.segment');
var Vector = require('../lib/node-sylvester/vector');

describe('line segment', function() {
    it('should create', function() {
	var lineSegment = Line.Segment.create([1, 2], [5, 6]);
	expect(lineSegment.line.anchor).toEqual(Vector.create([1, 2, 0]));
    })
});
