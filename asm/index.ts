export const FLOAT64ARRAY = idof<Float64Array>();

export function vectorMagnitude(elements: Float64Array): f64 {
  let sum: f64 = 0;
  for (let i = 0; i < elements.length; i++) {
    sum += elements[i] * elements[i];
  }

  return Math.sqrt(sum);
}
