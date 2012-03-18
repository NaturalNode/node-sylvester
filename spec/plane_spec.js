/*
Copyright (c) 2011, 2012 Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

Unless otherwise stated by a specific section of code

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
var sylvester = require('../lib/node-sylvester'),
Vector = sylvester.Vector,
Plane = sylvester.Plane;

describe('plane', function() {
    it('should create', function() {
	var plane = Plane.create([1,2,3], [5, 5, 5]);
	expect(plane.anchor).toEqual(Vector.create([1, 2, 3]));
    });

    it('should create with P$', function() {
	var A = Plane.create([1,2,3], [5, 5, 5]);
	var B = $P([1,2,3], [5, 5, 5]);

	expect(A).toEqual(B);
    });
});