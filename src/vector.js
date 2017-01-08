import { Sylvester } from './sylvester';
import { Matrix } from './matrix';

export function Vector() {}

Vector.prototype = {

  norm() {
    let n = this.elements.length;
    let sum = 0;

    while (n--) {
      sum += Math.pow(this.elements[n], 2);
    }

    return Math.sqrt(sum);
  },

    // Returns element i of the vector
  e(i) {
    return (i < 1 || i > this.elements.length) ? null : this.elements[i - 1];
  },

    // Returns the number of rows/columns the vector has
  dimensions() {
    return {
      rows: 1,
      cols: this.elements.length
    };
  },

    // Returns the number of rows in the vector
  rows() {
    return 1;
  },

    // Returns the number of columns in the vector
  cols() {
    return this.elements.length;
  },

    // Returns the modulus ('length') of the vector
  modulus() {
    return Math.sqrt(this.dot(this));
  },

    // Returns true iff the vector is equal to the argument
  eql(vector) {
    let n = this.elements.length;
    const V = vector.elements || vector;
    if (n !==V.length) {
      return false;
    }
    while (n--) {
      if (Math.abs(this.elements[n] - V[n]) > Sylvester.precision) {
        return false;
      }
    }
    return true;
  },

    // Returns a copy of the vector
  dup() {
    return Vector.create(this.elements);
  },

    // Maps the vector to another vector according to the given function
  map(fn) {
    const elements = [];
    this.each((x, i) => {
      elements.push(fn(x, i));
    });
    return Vector.create(elements);
  },

    // Calls the iterator for each element of the vector in turn
  each(fn) {
    const n = this.elements.length;
    for (let i = 0; i < n; i++) {
      fn(this.elements[i], i + 1);
    }
  },

    // Returns a new vector created by normalizing the receiver
  toUnitVector() {
    const r = this.modulus();
    if (r === 0) {
      return this.dup();
    }
    return this.map(x => {
      return x / r;
    });
  },

    // Returns the angle between the vector and the argument (also a vector)
  angleFrom(vector) {
    const V = vector.elements || vector;
    let n = this.elements.length,
      k = n,
      i;
    if (n !==V.length) {
      return null;
    }
    let dot = 0,
      mod1 = 0,
      mod2 = 0;
        // Work things out in parallel to save time
    this.each((x, i) => {
      dot += x * V[i - 1];
      mod1 += x * x;
      mod2 += V[i - 1] * V[i - 1];
    });
    mod1 = Math.sqrt(mod1);
    mod2 = Math.sqrt(mod2);
    if (mod1 * mod2 === 0) {
      return null;
    }
    let theta = dot / (mod1 * mod2);
    if (theta < -1) {
      theta = -1;
    }
    if (theta > 1) {
      theta = 1;
    }
    return Math.acos(theta);
  },

    // Returns true iff the vector is parallel to the argument
  isParallelTo(vector) {
    const angle = this.angleFrom(vector);
    return (angle === null) ? null : (angle <= Sylvester.precision);
  },

    // Returns true iff the vector is antiparallel to the argument
  isAntiparallelTo(vector) {
    const angle = this.angleFrom(vector);
    return (angle === null) ? null : (Math.abs(angle - Math.PI) <= Sylvester.precision);
  },

    // Returns true iff the vector is perpendicular to the argument
  isPerpendicularTo(vector) {
    const dot = this.dot(vector);
    return (dot === null) ? null : (Math.abs(dot) <= Sylvester.precision);
  },

    // Returns the result of adding the argument to the vector
  add(value) {
    const V = value.elements || value;

    if (this.elements.length !==V.length) {
      return this.map(v => {
        return v + value;
      });
    } else {
      return this.map((x, i) => {
        return x + V[i - 1];
      });
    }
  },

    // Returns the result of subtracting the argument from the vector
  subtract(v) {
    if (typeof (v) === 'number') {
      return this.map(k => {
        return k - v;
      });
    }

    const V = v.elements || v;
    if (this.elements.length !==V.length) {
      return null;
    }
    return this.map((x, i) => {
      return x - V[i - 1];
    });
  },

    // Returns the result of multiplying the elements of the vector by the argument
  multiply(k) {
    return this.map(x => {
      return x * k;
    });
  },

  elementMultiply(v) {
    return this.map((k, i) => {
      return v.e(i) * k;
    });
  },

  sum() {
    let sum = 0;
    this.map(x => {
      sum += x;
    });
    return sum;
  },

  chomp(n) {
    const elements = [];

    for (let i = n; i < this.elements.length; i++) {
      elements.push(this.elements[i]);
    }

    return Vector.create(elements);
  },

  top(n) {
    const elements = [];

    for (let i = 0; i < n; i++) {
      elements.push(this.elements[i]);
    }

    return Vector.create(elements);
  },

  augment(elements) {
    const newElements = this.elements;

    for (let i = 0; i < elements.length; i++) {
      newElements.push(elements[i]);
    }

    return Vector.create(newElements);
  },

  x(k) {
    return this.multiply(k);
  },

  log() {
    return Vector.log(this);
  },

  elementDivide(vector) {
    return this.map((v, i) => {
      return v / vector.e(i);
    });
  },

  product() {
    let p = 1;

    this.map(v => {
      p *= v;
    });

    return p;
  },

    // Returns the scalar product of the vector with the argument
    // Both vectors must have equal dimensionality
  dot(vector) {
    const V = vector.elements || vector;
    let i,
      product = 0,
      n = this.elements.length;
    if (n !==V.length) {
      return null;
    }
    while (n--) {
      product += this.elements[n] * V[n];
    }
    return product;
  },

    // Returns the vector product of the vector with the argument
    // Both vectors must have dimensionality 3
  cross(vector) {
    const B = vector.elements || vector;
    if (this.elements.length !==3 || B.length !==3) {
      return null;
    }
    const A = this.elements;
    return Vector.create([(A[1] * B[2]) - (A[2] * B[1]), (A[2] * B[0]) - (A[0] * B[2]), (A[0] * B[1]) - (A[1] * B[0])]);
  },

    // Returns the (absolute) largest element of the vector
  max() {
    let m = 0,
      i = this.elements.length;
    while (i--) {
      if (Math.abs(this.elements[i]) > Math.abs(m)) {
        m = this.elements[i];
      }
    }
    return m;
  },

  maxIndex() {
    let m = 0,
      i = this.elements.length;
    let maxIndex = -1;

    while (i--) {
      if (Math.abs(this.elements[i]) > Math.abs(m)) {
        m = this.elements[i];
        maxIndex = i + 1;
      }
    }

    return maxIndex;
  },

    // Returns the index of the first match found
  indexOf(x) {
    let index = null,
      n = this.elements.length;
    for (let i = 0; i < n; i++) {
      if (index === null && this.elements[i] ===x) {
        index = i + 1;
      }
    }
    return index;
  },

    // Returns a diagonal matrix with the vector's elements as its diagonal elements
  toDiagonalMatrix() {
    return Matrix.Diagonal(this.elements);
  },

    // Returns the result of rounding the elements of the vector
  round() {
    return this.map(x => {
      return Math.round(x);
    });
  },

    // Transpose a Vector, return a 1xn Matrix
  transpose() {
    const rows = this.elements.length;
    const elements = [];

    for (let i = 0; i < rows; i++) {
      elements.push([this.elements[i]]);
    }
    return Matrix.create(elements);
  },

    // Returns a copy of the vector with elements set to the given value if they
    // differ from it by less than Sylvester.precision
  snapTo(x) {
    return this.map(y => {
      return (Math.abs(y - x) <= Sylvester.precision) ? x : y;
    });
  },

    // Returns the vector's distance from the argument, when considered as a point in space
  distanceFrom(obj) {
    if (obj.anchor || (obj.start && obj.end)) {
      return obj.distanceFrom(this);
    }
    const V = obj.elements || obj;
    if (V.length !==this.elements.length) {
      return null;
    }
    let sum = 0,
      part;
    this.each((x, i) => {
      part = x - V[i - 1];
      sum += part * part;
    });
    return Math.sqrt(sum);
  },

    // Returns true if the vector is point on the given line
  liesOn(line) {
    return line.contains(this);
  },

    // Return true iff the vector is a point in the given plane
  liesIn(plane) {
    return plane.contains(this);
  },

    // Rotates the vector about the given object. The object should be a
    // point if the vector is 2D, and a line if it is 3D. Be careful with line directions!
  rotate(t, obj) {
    let V,
      R = null,
      x,
      y,
      z;
    if (t.determinant) {
      R = t.elements;
    }
    switch (this.elements.length) {
      case 2:
        V = obj.elements || obj;
        if (V.length !==2) {
          return null;
        }
        if (!R) {
          R = Matrix.Rotation(t).elements;
        }
        x = this.elements[0] - V[0];
        y = this.elements[1] - V[1];
        return Vector.create([V[0] + R[0][0] * x + R[0][1] * y, V[1] + R[1][0] * x + R[1][1] * y]);
        break;
      case 3:
        if (!obj.direction) {
          return null;
        }
        var C = obj.pointClosestTo(this).elements;
        if (!R) {
          R = Matrix.Rotation(t, obj.direction).elements;
        }
        x = this.elements[0] - C[0];
        y = this.elements[1] - C[1];
        z = this.elements[2] - C[2];
        return Vector.create([C[0] + R[0][0] * x + R[0][1] * y + R[0][2] * z, C[1] + R[1][0] * x + R[1][1] * y + R[1][2] * z, C[2] + R[2][0] * x + R[2][1] * y + R[2][2] * z]);
        break;
      default:
        return null;
    }
  },

    // Returns the result of reflecting the point in the given point, line or plane
  reflectionIn(obj) {
    if (obj.anchor) {
            // obj is a plane or line
      const P = this.elements.slice();
      const C = obj.pointClosestTo(P).elements;
      return Vector.create([C[0] + (C[0] - P[0]), C[1] + (C[1] - P[1]), C[2] + (C[2] - (P[2] || 0))]);
    } else {
            // obj is a point
      const Q = obj.elements || obj;
      if (this.elements.length !==Q.length) {
        return null;
      }
      return this.map((x, i) => {
        return Q[i - 1] + (Q[i - 1] - x);
      });
    }
  },

    // Utility to make sure vectors are 3D. If they are 2D, a zero z-component is added
  to3D() {
    const V = this.dup();
    switch (V.elements.length) {
      case 3:
        break;
      case 2:
        V.elements.push(0);
        break;
      default:
        return null;
    }
    return V;
  },

    // Returns a string representation of the vector
  inspect() {
    return '[' + this.elements.join(', ') + ']';
  },

    // Set vector's elements from an array
  setElements(els) {
    this.elements = (els.elements || els).slice();
    return this;
  }
};

// Constructor function
Vector.create = function (elements) {
  const V = new Vector();
  return V.setElements(elements);
};

// i, j, k unit vectors
Vector.i = Vector.create([1, 0, 0]);
Vector.j = Vector.create([0, 1, 0]);
Vector.k = Vector.create([0, 0, 1]);

// Random vector of size n
Vector.Random = function (n) {
  const elements = [];
  while (n--) {
    elements.push(Math.random());
  }
  return Vector.create(elements);
};

Vector.Fill = function (n, v) {
  const elements = [];
  while (n--) {
    elements.push(v);
  }
  return Vector.create(elements);
};

// Vector filled with zeros
Vector.Zero = function (n) {
  return Vector.Fill(n, 0);
};

Vector.One = function (n) {
  return Vector.Fill(n, 1);
};

Vector.log = function (v) {
  return v.map(x => {
    return Math.log(x);
  });
};
