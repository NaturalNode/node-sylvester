import chai from 'chai';
import { Matrix, Vector, Sylvester, Line, Plane } from '../src';
import { Segment } from '../src/line';

chai.Assertion.addProperty('matrix', function () {
  new chai.Assertion(this._obj).to.be.instanceOf(Matrix);

  return {
    equal: other => {
      if (!(other instanceof Matrix)) {
        other = Matrix.create(other);
      }

      this.assert(
        this._obj.eql(other),
        'expected #{this} to equal #{exp}',
        'expected #{this} to not equal #{exp}',
        this._obj,
        other,
        true
      );
    }
  };
});

chai.Assertion.addProperty('vector', function () {
  new chai.Assertion(this._obj).to.be.instanceOf(Vector);

  return {
    equal: other => {
      if (!(other instanceof Vector)) {
        other = new Vector(other);
      }

      this.assert(
        this._obj.eql(other),
        'expected #{this} to equal #{exp}',
        'expected #{this} to not equal #{exp}',
        this._obj,
        other,
        true
      );
    }
  };
});

chai.Assertion.addProperty('line', function () {
  new chai.Assertion(this._obj).to.be.instanceOf(Line);

  return {
    equal: (lineOrOrigin, direction) => {
      if (!(lineOrOrigin instanceof Line)) {
        lineOrOrigin = new Line(lineOrOrigin, direction);
      }

      this.assert(
        this._obj.eql(lineOrOrigin, 0.001),
        'expected #{this} to equal #{exp}',
        'expected #{this} to not equal #{exp}',
        this._obj,
        lineOrOrigin,
        true
      );
    }
  };
});

chai.Assertion.addProperty('segment', function () {
  new chai.Assertion(this._obj).to.be.instanceOf(Segment);

  return {
    equal: (startOrSegment, end) => {
      if (!(startOrSegment instanceof Segment)) {
        startOrSegment = new Line.Segment(startOrSegment, end);
      }

      this.assert(
        this._obj.eql(startOrSegment, 0.001),
        'expected #{this} to equal #{exp}',
        'expected #{this} to not equal #{exp}',
        this._obj,
        startOrSegment,
        true
      );
    }
  };
});

chai.Assertion.addProperty('plane', function () {
  new chai.Assertion(this._obj).to.be.instanceOf(Plane);

  return {
    equal: (expectedPlane) => {
      this.assert(
        this._obj.eql(expectedPlane, 0.001),
        'expected #{this} to equal #{exp}',
        'expected #{this} to not equal #{exp}',
        this._obj,
        expectedPlane,
        true
      );
    }
  };
});

chai.Assertion.addProperty('approx', function () {
  return {
    equal: other => {
      this.assert(
        Math.abs(this._obj - other) < Sylvester.precision,
        'expected #{this} to about equal #{exp}',
        'expected #{this} to not equal #{exp}',
        this._obj,
        other,
        true
      );
    }
  };
});
