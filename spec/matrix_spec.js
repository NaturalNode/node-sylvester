
var Matrix = require('../lib/node-sylvester/matrix');

describe('matrix', function() {
    it('should multiply', function() {
	var A = Matrix.create([[1, 2, 3], [4, 5, 6]]);
	expect(A.x(Matrix.create([[1, 2], [3, 4], [5, 6]]))).toEqual(Matrix.create([[22, 28], [49, 64]]));
    });
});