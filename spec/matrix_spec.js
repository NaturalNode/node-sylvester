
var sylvester = require('../lib/node-sylvester'),
Matrix = sylvester.Matrix;
var A = Matrix.create([[1, 2, 3], [4, 5, 6]]);

describe('matrix', function() {

    it('should create a 1\'s matrix', function() {
	var Ones = Matrix.One(2, 3);
	expect(Ones).toEqual($M([[1,1,1], [1,1,1]]));
    });

    it('columns should be retrievable as vectors', function() {
	expect(A.column(2)).toEqual($V([2, 5]));;
    });

    it('should log', function() {
	expect(A.log()).toEqual($M([[0, 0.6931471805599453, 1.0986122886681098],
	  [1.3862943611198906, 1.6094379124341003, 1.791759469228055]]));
    });

    it('should sum', function() {
	expect(A.sum()).toBe(21);
    });

    it('should multiply', function() {
	expect(A.x(Matrix.create([[1, 2], [3, 4], [5, 6]]))).toEqual(Matrix.create([[22, 28], [49, 64]]));
    });

    it('should multiply', function() {
	var B = $M([[1, 2, 3], [4, 5, 6]]);
	expect(A).toEqual(B);
    });

    it('should evaluate equal matrices', function() {
	var A = $M([[1, 2, 3], [4, 5, 6]]);
	var B = $M([[1, 2, 3], [4, 5, 6]]);

	expect(A.eql(B)).toBeTruthy();
    });

    it('should evaluate inequal matrices', function() {
	var A = $M([[1, 2, 3], [4, 5, 6]]);
	var B = $M([[1, 2, 3], [4, 5, 7]]);

	expect(A.eql(B)).toBeFalsy();
    });

    it('should snap', function() {
	expect($M([[1, 1.1, 1.00000001], [4, 5, 6]]).snapTo(1).eql(
	    $M([[1, 1.1, 1], [4, 5, 6]]))).toBeTruthy();
    });
});