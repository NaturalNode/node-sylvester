import { Sylvester } from './sylvester';
import { Polygon } from './polygon';
import { Vector } from './vector';

Polygon.Vertex = function (point) {
  this.setElements(point);
  if (this.elements.length ===2) {
    this.elements.push(0);
  }
  if (this.elements.length !==3) {
    return null;
  }
};
Polygon.Vertex.prototype = new Vector();

// Returns true iff the vertex's internal angle is 0 <= x < 180
// in the context of the given polygon object. Returns null if the
// vertex does not exist in the polygon.
Polygon.Vertex.prototype.isConvex = function (polygon) {
  const node = polygon.nodeFor(this);
  if (node === null) {
    return null;
  }
  let prev = node.prev.data,
    next = node.next.data;
  const A = next.subtract(this);
  const B = prev.subtract(this);
  const theta = A.angleFrom(B);
  if (theta <= Sylvester.precision) {
    return true;
  }
  if (Math.abs(theta - Math.PI) <= Sylvester.precision) {
    return false;
  }
  return (A.cross(B).dot(polygon.plane.normal) > 0);
};
// Returns true iff the vertex's internal angle is 180 <= x < 360
Polygon.Vertex.prototype.isReflex = function (polygon) {
  const result = this.isConvex(polygon);
  return (result === null) ? null : !result;
};
Polygon.Vertex.prototype.type = function (polygon) {
  const result = this.isConvex(polygon);
  return (result === null) ? null : (result ? 'convex' : 'reflex');
};

// Method for converting a set of arrays/vectors/whatever to a set of Polygon.Vertex objects
Polygon.Vertex.convert = function (points) {
  const pointSet = points.toArray ? points.toArray() : points;
  let list = [],
    n = pointSet.length;
  for (let i = 0; i < n; i++) {
    list.push(new Polygon.Vertex(pointSet[i]));
  }
  return list;
};

module.exports = Polygon.Vertex;
