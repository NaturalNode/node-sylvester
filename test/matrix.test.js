import { expect } from 'chai';
import { OutOfRangeError, Matrix, Vector, DimensionalityMismatchError } from '../src';
import { record } from './docs/record';

const A = new Matrix([
  [1, 2, 3],
  [4, 5, 6],
]);

describe('matrix', () => {
  it('Matrix.forwardSubstitute', () => {
    const L = new Matrix([
      [1, 0, 0],
      [0.5, 1, 0],
      [2, 3, 1],
    ]);
    const b = new Vector([1, 2, 3]);

    record(L)
      .forwardSubstitute(b)
      .to.vector.equal([1, 1.5, -3.5]);
  });

  it('Matrix.backSubstitute', () => {
    const L = new Matrix([
      [4, 4],
      [0, 1],
    ]);
    const b = new Vector([1, 1.5]);

    record(L)
      .backSubstitute(b)
      .to.vector.equal([-1.25, 1.5]);
  });

  it('Matrix.eql', () => {
    A.should;
  });

  it('Matrix.solve', () => {
    // 2x + 3y = 2
    // 4x + 4y = 1
    // x = -1.25
    // y = 1.5
    const M = new Matrix([
      [2, 3],
      [4, 4],
    ]);

    const b = new Vector([2, 1]);
    expect(M.solve(b)).to.vector.equal(new Vector([1.5, -1.25]));
  });

  describe('lu', () => {
    it('should perform LU decomp on rectangular matrices', () => {
      const D = new Matrix([
        [3, 6],
        [2, 3],
        [4, 3],
        [2, 120],
      ]);

      const lu = D.lu();
      expect(lu.P.x(lu.L.x(lu.U))).to.matrix.equal(D);
    });

    it('should perform LU decomp', () => {
      const A = new Matrix([
        [4, 2, 1, 4],
        [-9, 4, 3, 9],
        [11, 3, 11, 3],
        [-4, 5, 3, 1],
      ]);

      const lu = A.lu();

      expect(
        lu.L.eql(
          new Matrix([
            [1, 0, 0, 0],
            [-0.818181818181818, 1, 0, 0],
            [0.363636363636364, 0.140845070422535, 1, 0],
            [-0.363636363636364, 0.943661971830986, 0.921921921921922, 1],
          ]),
        ),
      ).to.be.true;

      expect(
        lu.U.eql(
          new Matrix([
            [11, 3, 11, 3],
            [0, 6.454545454545455, 12, 11.454545454545455],
            [0, 0, -4.690140845070422, 1.295774647887324],
            [0, 0, 0, -9.912912912912912],
          ]),
        ),
      ).to.be.true;

      expect(lu.P).to.matrix.equal([
        [0, 0, 1, 0],
        [0, 1, 0, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 1],
      ]);
    });
  });

  describe('pca', () => {
    it('should PCA', () => {
      const pca = new Matrix([
        [1, 2],
        [5, 7],
      ]).pcaProject(1);

      expect(pca.Z).to.matrix.equal([[-2.2120098720461616], [-8.601913944732665]]);
      expect(pca.U).to.matrix.equal([
        [-0.5732529283807336, -0.819378471832714],
        [-0.819378471832714, 0.5732529283807336],
      ]);
    });

    it('should recover', () => {
      const U = new Matrix([
        [-0.5732529283807336, -0.819378471832714],
        [-0.819378471832714, 0.5732529283807336],
      ]);
      const Z = new Matrix([[-2.2120098720461616], [-8.601913944732665]]);

      expect(Z.pcaRecover(U)).to.matrix.equal([
        [1.268041136757554, 1.812473268636061],
        [4.931072358497068, 7.048223102871564],
      ]);
    });
  });

  it('Matrix.triu', () => {
    const A2 = new Matrix([
      [1, -1, 2, 2],
      [-1, 2, 1, -1],
      [2, 1, 3, 2],
      [2, -1, 2, 1],
    ]);

    record(A2)
      .triu()
      .to.matrix.equal([
        [1, -1, 2, 2],
        [0, 2, 1, -1],
        [0, 0, 3, 2],
        [0, 0, 0, 1],
      ]);

    record(A2)
      .triu(1)
      .to.matrix.equal([
        [0, -1, 2, 2],
        [0, 0, 1, -1],
        [0, 0, 0, 2],
        [0, 0, 0, 0],
      ]);
  });

  it('Matrix.unroll', () => {
    record(A)
      .unroll()
      .to.vector.equal([1, 4, 2, 5, 3, 6]);
  });

  it('Matrix.slice', () => {
    const A2 = new Matrix([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
    record(A2)
      .slice(2, 3, 2, 3)
      .to.matrix.equal([
        [5, 6],
        [8, 9],
      ]);
    record(A2)
      .slice(2, 0, 2, 0)
      .to.matrix.equal([
        [5, 6],
        [8, 9],
      ]);
  });

  const U = new Matrix([
    [-0.5110308651281587, 0.2132007163556105, 0.7071067811881557, 0.4397646068404634],
    [0.08729449334404742, -0.8528028654224428, 1.882731224298497e-12, 0.514885369921382],
    [-0.6856198518162525, -0.42640143271122105, -2.157344709257849e-12, -0.5900061329997158],
    [-0.5110308651281581, 0.21320071635561055, -0.7071067811849397, 0.4397646068456342],
  ]);
  const S = new Matrix([
    [5.85410196624969, 0, 0, 0],
    [0, 2.999999999999999, 0, 0],
    [0, 0, 1.0000000000000002, 0],
    [0, 0, 0, 0.8541019662496846],
  ]);
  const V = new Matrix([
    [-0.5110308651281575, 0.21320071635561047, -0.7071067811884307, -0.43976460684002194],
    [0.08729449334404744, -0.8528028654224414, -2.2043789591597237e-12, -0.5148853699213815],
    [-0.6856198518162527, -0.42640143271122066, 2.525858488366184e-12, 0.590006132999716],
    [-0.5110308651281579, 0.21320071635561044, 0.7071067811846652, -0.4397646068460757],
  ]);

  const ASVD = new Matrix([
    [1, -1, 2, 2],
    [-1, 2, 1, -1],
    [2, 1, 3, 2],
    [2, -1, 2, 1],
  ]);

  it('should svd', () => {
    const svd = ASVD.svd();
    expect(svd.U).to.matrix.equal(U);
    expect(svd.S).to.matrix.equal(S);
    expect(svd.V).to.matrix.equal(V);
  });

  const QRin = new Matrix([
    [1, -1, 2, 2],
    [-1, 2, 1, -1],
    [2, 1, 3, 2],
    [2, -1, 2, 1],
  ]);

  const Qout = new Matrix([
    [-0.316227766016838, 0.28342171556262064, 0.8226876614429064, -0.3779644730092273],
    [0.31622776601683794, -0.6883098806520787, 0.5323273103454103, 0.3779644730092272],
    [-0.6324555320336759, -0.6478210641431328, -0.19357356739833098, -0.37796447300922714],
    [-0.6324555320336759, 0.16195526603578317, 0.048393391849582745, 0.7559289460184544],
  ]);
  const Rout = new Matrix([
    [-3.1622776601683795, 0.9486832980505139, -3.478505426185217, -2.8460498941515415],
    [1.91055907392895e-17, -2.4698178070456938, -1.7410191098846692, 0.1214664495268375],
    [-2.254600901479451e-16, 2.0686390257580927e-16, 1.6937687147353957, 0.7742942695933234],
    [3.446764628337833e-17, 8.098938594673387e-17, 2.220446049250313e-16, -1.1338934190276815],
  ]);

  it('should qr from javascript', () => {
    const qr = QRin.qr();
    expect(qr.Q).to.matrix.equal(Qout);
    expect(qr.R).to.matrix.equal(Rout);
  });

  it("should create a 1's matrix", () => {
    const Ones = Matrix.One(2, 3);
    expect(Ones).to.matrix.equal([
      [1, 1, 1],
      [1, 1, 1],
    ]);
  });

  it('Matrix.col', () => {
    expect(() => A.col(0)).to.throw(OutOfRangeError);
    expect(() => A.col(5)).to.throw(OutOfRangeError);
    record(A)
      .col(1)
      .to.vector.equal([1, 4]);
  });

  it('Matrix.row', () => {
    expect(() => A.row(0)).to.throw(OutOfRangeError);
    expect(() => A.row(5)).to.throw(OutOfRangeError);
    record(A)
      .row(1)
      .to.vector.equal([1, 2, 3]);
  });

  it('Matrix.log', () => {
    record(A)
      .log()
      .to.matrix.equal([
        [0, 0.6931471805599453, 1.0986122886681098],
        [1.3862943611198906, 1.6094379124341003, 1.791759469228055],
      ]);
  });

  it('Matrix.sum', () => {
    record(A)
      .sum()
      .to.equal(21);
  });

  it('Matrix.std', () => {
    record(A)
      .std()
      .to.vector.equal([1.5, 1.5, 1.5]);
  });

  it('Matrix.multiply', () => {
    record(A)
      .multiply(
        new Matrix([
          [1, 2],
          [3, 4],
          [5, 6],
        ]),
      )
      .to.matrix.equal([
        [22, 28],
        [49, 64],
      ]);
    expect(
      A.multiply([
        [1, 2],
        [3, 4],
        [5, 6],
      ]),
    ).to.matrix.equal([
      [22, 28],
      [49, 64],
    ]);
    expect(() =>
      A.multiply(
        new Matrix([
          [1, 2],
          [3, 4],
        ]),
      ),
    ).to.throw(DimensionalityMismatchError);
  });

  describe('equal', () => {
    it('should evaluate equal matrices', () => {
      const A = new Matrix([
        [1, 2, 3],
        [4, 5, 6],
      ]);
      const B = new Matrix([
        [1, 2, 3],
        [4, 5, 6],
      ]);

      expect(A).to.matrix.equal(B);
    });

    it('should evaluate inequal matrices', () => {
      const A = new Matrix([
        [1, 2, 3],
        [4, 5, 6],
      ]);
      const B = new Matrix([
        [1, 2, 3],
        [4, 5, 7],
      ]);

      expect(A).to.not.matrix.equal(B);
    });

    it('should evaluate different sized matrices', () => {
      const A = new Matrix([
        [1, 2, 3],
        [4, 5, 6],
      ]);
      const B = new Matrix([
        [1, 2],
        [4, 5],
      ]);

      expect(A).to.not.matrix.equal(B);
    });

    it('should allow direct array comparison', () => {
      expect(A.eql(A.elements)).to.be.true;
    });
  });

  it('Matrix.snapTo', () => {
    record(
      new Matrix([
        [1, 1.1, 1.00000001],
        [4, 5, 6],
      ]),
    )
      .snapTo(1)
      .to.matrix.equal([
        [1, 1.1, 1],
        [4, 5, 6],
      ]);
  });

  it('Matrix.minColumnIndexes', () => {
    record(
      new Matrix([
        [1, 2, 3],
        [2, 1, 3],
        [2, 1, 0],
      ]),
    )
      .minColumnIndexes()
      .to.vector.equal([1, 2, 3]);
  });

  it('Matrix.minColumns', () => {
    record(
      new Matrix([
        [1, 2, 3],
        [2, 1, 3],
        [2, 1, 0],
      ]),
    )
      .minColumns()
      .to.vector.equal([1, 1, 0]);
  });

  it('Matrix.maxColumnIndexes', () => {
    record(
      new Matrix([
        [1, 2, 3],
        [2, 3, 2],
        [2, 1, 0],
      ]),
    )
      .maxColumnIndexes()
      .to.vector.equal([3, 2, 1]);
  });

  it('Matrix.maxColumns', () => {
    record(
      new Matrix([
        [1, 2, 3],
        [2, 1, 3],
        [2, 1, 0],
      ]),
    )
      .maxColumns()
      .to.vector.equal([3, 3, 2]);
  });

  it('Matrix.e', () => {
    record(A)
      .e(1, 2)
      .to.equal(2);
    record(A).e(0, 1).to.be.null;
    expect(A.e(1, 0)).to.be.null;
    expect(A.e(5, 0)).to.be.null;
    expect(A.e(0, 5)).to.be.null;
  });

  describe('add', () => {
    it('adds a number', () => {
      record(
        new Matrix([
          [1, 2],
          [3, 4],
        ]),
        { name: 'Matrix.add' },
      )
        .add(2)
        .to.matrix.equal([
          [3, 4],
          [5, 6],
        ]);
    });

    it('adds two matrices', () => {
      record(
        new Matrix([
          [1, 2],
          [3, 4],
        ]),
        { name: 'Matrix.add' },
      )
        .add(
          new Matrix([
            [2, 1],
            [5, 1],
          ]),
        )
        .to.matrix.equal([
          [3, 3],
          [8, 5],
        ]);

      expect(
        new Matrix([
          [1, 2],
          [3, 4],
        ]).add([
          [2, 1],
          [5, 1],
        ]),
      ).to.matrix.equal([
        [3, 3],
        [8, 5],
      ]);
    });

    it('throws if matricies different sizes', () => {
      expect(() =>
        new Matrix([
          [1, 2],
          [3, 4],
        ]).add(new Matrix([[2, 1]])),
      ).to.throw(DimensionalityMismatchError);
    });
  });

  describe('subtract', () => {
    it('subtracts a number', () => {
      record(
        new Matrix([
          [1, 2],
          [3, 4],
        ]),
        { name: 'Matrix.subtract' },
      )
        .subtract(2)
        .to.matrix.equal([
          [-1, 0],
          [1, 2],
        ]);
    });

    it('subtracts two matrices', () => {
      record(
        new Matrix([
          [1, 2],
          [3, 4],
        ]),
        { name: 'Matrix.subtract' },
      )
        .subtract(
          new Matrix([
            [2, 1],
            [5, 1],
          ]),
        )
        .to.matrix.equal([
          [-1, 1],
          [-2, 3],
        ]);
      expect(
        new Matrix([
          [1, 2],
          [3, 4],
        ]).subtract([
          [2, 1],
          [5, 1],
        ]),
      ).to.matrix.equal([
        [-1, 1],
        [-2, 3],
      ]);
    });

    it('throws if matricies different sizes', () => {
      expect(() =>
        new Matrix([
          [1, 2],
          [3, 4],
        ]).subtract(new Matrix([[2, 1]])),
      ).to.throw(DimensionalityMismatchError);
    });
  });

  it('Matrix.isSameSizeAs', () => {
    record(
      new Matrix([
        [1, 2],
        [3, 4],
      ]),
    ).isSameSizeAs(
      new Matrix([
        [2, 3],
        [4, 5],
      ]),
    ).to.be.true;
    record(
      new Matrix([
        [1, 2],
        [3, 4],
      ]),
    ).isSameSizeAs(new Matrix([[2], [4]])).to.be.false;
    expect(
      new Matrix([
        [1, 2],
        [3, 4],
      ]).isSameSizeAs(new Matrix([[2, 3]])),
    ).to.be.false;
  });

  it('Matrix.elementMultiply', () => {
    record(
      new Matrix([
        [1, 2],
        [3, 4],
      ]),
    )
      .elementMultiply(
        new Matrix([
          [2, 4],
          [6, 8],
        ]),
      )
      .to.matrix.equal([
        [2, 8],
        [18, 32],
      ]);
    expect(() =>
      new Matrix([
        [1, 2],
        [3, 4],
      ]).elementMultiply(new Matrix([[2, 4]])),
    ).throw(DimensionalityMismatchError);
  });

  it('Matrix.mean', () => {
    record(A)
      .mean()
      .to.vector.equal([2.5, 3.5, 4.5]);
  });

  it('Matrix.isSquare', () => {
    record(
      new Matrix([
        [1, 2],
        [3, 4],
      ]),
    ).isSquare().to.be.true;
    record(new Matrix([[1, 2]])).isSquare().to.be.false;
  });

  it('Matrix.max', () => {
    record(A)
      .max()
      .to.equal(6);
  });

  it('Matrix.indexOf', () => {
    record(A)
      .indexOf(6)
      .to.deep.equal({ i: 2, j: 3 });
    record(
      new Matrix([
        [1, 2],
        [1, 2],
      ]),
    )
      .indexOf(2)
      .to.deep.equal({ i: 1, j: 2 });
    record(A).indexOf(-1).to.be.null;
  });

  it('Matrix.minor', () => {
    record(A)
      .minor(2, 2, 3, 4)
      .to.matrix.equal([
        [5, 6, 4, 5],
        [2, 3, 1, 2],
        [5, 6, 4, 5],
      ]);
  });

  it('Matrix.diagonal', () => {
    expect(() => A.diagonal()).to.throw(DimensionalityMismatchError);
    record(
      new Matrix([
        [1, 2],
        [3, 4],
      ]),
    )
      .diagonal()
      .to.vector.equal([1, 4]);
  });

  it('Matrix.toRightTriangular', () => {
    record(
      new Matrix([
        [1, -3, 1, 4],
        [2, -8, 8, -2],
        [-6, 3, -15, 9],
      ]),
    )
      .toRightTriangular()
      .to.matrix.equal([
        [1, -3, 1, 4],
        [0, -2, 6, -10],
        [0, 0, -54, 108],
      ]);

    record(
      new Matrix([
        [0, 0, 2, 4], // => [2, -8, 10, 2] after correction
        [0, 4, -5, 7],
        [2, -8, 8, -2],
      ]),
    )
      .toRightTriangular()
      .to.matrix.equal([
        [2, -8, 10, 2],
        [0, 4, -5, 7],
        [0, 0, -2, -4],
      ]);
  });

  it('Matrix.determinant', () => {
    record(new Matrix([[42]]))
      .det()
      .to.equal(42);
    record(
      new Matrix([
        [1, 2],
        [3, 4],
      ]),
    )
      .det()
      .to.equal(-2);
    expect(() => A.det()).to.throw(DimensionalityMismatchError);
  });

  it('Matrix.isSingular', () => {
    record(A).isSingular().to.be.false;
    record(
      new Matrix([
        [1, 2],
        [3, 4],
      ]),
    ).isSingular().to.be.false;
    record(
      new Matrix([
        [1, 2],
        [2, 4],
      ]),
    ).isSingular().to.be.true;
  });

  it('Matrix.trace', () => {
    expect(() => A.trace()).to.throw(DimensionalityMismatchError);
    record(
      new Matrix([
        [3, 2],
        [3, 4],
      ]),
    )
      .trace()
      .to.equal(7);
  });

  it('Matrix.transpose', () => {
    record(A)
      .transpose()
      .to.matrix.equal([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
  });

  it('Matrix.rank', () => {
    record(A)
      .rank()
      .to.equal(2);
    record(
      new Matrix([
        [1, 2],
        [2, 4],
      ]),
    )
      .rank()
      .to.equal(1);
  });

  it('Matrix.inverse', () => {
    expect(() => A.inverse()).to.throw(DimensionalityMismatchError, /must be square/);
    expect(() =>
      new Matrix([
        [1, 2],
        [2, 4],
      ]).inverse(),
    ).to.throw(DimensionalityMismatchError, /determinant=0/);
    record(
      new Matrix([
        [1, 2],
        [3, 4],
      ]),
    )
      .inverse()
      .to.matrix.equal([
        [-2, 1],
        [1.5, -0.5],
      ]);
  });

  it('Matrix.round', () => {
    record(new Matrix([0.25, 0.5]))
      .round()
      .to.matrix.equal([0, 1]);
  });

  it('Matrix.snapTo', () => {
    record(new Matrix([-1, 0.25, 0.5, 0.75, 1]))
      .snapTo(0.3, 0.5)
      .to.matrix.equal([-1, 0.3, 0.3, 0.3, 1]);
  });

  it('Matrix.toString', () => {
    expect(A.toString()).to.equal('Matrix<\n  [1, 2, 3]\n  [4, 5, 6]\n>');
  });

  it('Matrix.toArray', () => {
    expect(A.toArray()).to.deep.equal([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it('Matrix.Rotation', () => {
    record(Matrix)
      .Rotation(Math.PI / 5)
      .to.matrix.equal([
        [0.80902, -0.58779],
        [0.58779, 0.80902],
      ]);
    record(Matrix)
      .Rotation(Math.PI / 5, new Vector([1, 2, 3]))
      .to.matrix.equal([
        [0.82265, -0.44399, 0.3551],
        [0.49855, 0.86358, -0.07524],
        [-0.27325, 0.23894, 0.93179],
      ]);
    expect(() => Matrix.Rotation(0, new Vector([1]))).to.throw(DimensionalityMismatchError);
  });

  it('Matrix.RotationX', () => {
    record(Matrix)
      .RotationX(Math.PI / 2)
      .to.matrix.equal([
        [1, 0, 0],
        [0, 0, -1],
        [0, 1, 0],
      ]);
  });

  it('Matrix.RotationY', () => {
    record(Matrix)
      .RotationY(Math.PI / 2)
      .to.matrix.equal([
        [0, 0, 1],
        [0, 1, 0],
        [-1, 0, 0],
      ]);
  });

  it('Matrix.RotationZ', () => {
    record(Matrix)
      .RotationZ(Math.PI / 2)
      .to.matrix.equal([
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, 1],
      ]);
  });

  it('Matrix.Random', () => {
    const r1 = Matrix.Random(2, 3);
    expect(r1.rows).to.equal(2);
    expect(r1.cols).to.equal(3);
    r1.map(v => expect(v).to.be.within(0, 1));

    const r2 = Matrix.Random(2);
    expect(r2.rows).to.equal(2);
    expect(r2.cols).to.equal(2);
  });

  it('Matrix.augment', () => {
    record(A)
      .augment(Matrix.I(2))
      .to.matrix.equal([
        [1, 2, 3, 1, 0],
        [4, 5, 6, 0, 1],
      ]);

    expect(
      A.augment([
        [1, 0],
        [0, 1],
      ]),
    ).to.matrix.equal([
      [1, 2, 3, 1, 0],
      [4, 5, 6, 0, 1],
    ]);

    expect(() => A.augment([[1]])).to.throw(DimensionalityMismatchError);
  });

  it('Matrix.Fill', () => {
    record(Matrix)
      .Fill(2, 3, 4)
      .to.matrix.equal([
        [4, 4, 4],
        [4, 4, 4],
      ]);
    expect(Matrix.Fill(2, 4)).to.matrix.equal([
      [4, 4],
      [4, 4],
    ]);
  });

  it('Matrix.One', () => {
    record(Matrix)
      .One(2, 3)
      .to.matrix.equal([
        [1, 1, 1],
        [1, 1, 1],
      ]);
  });

  it('Matrix.Zero', () => {
    record(Matrix)
      .Zero(2, 3)
      .to.matrix.equal([
        [0, 0, 0],
        [0, 0, 0],
      ]);
  });

  it('Matrix.Diagonal', () => {
    record(Matrix)
      .Diagonal([1, 2, 3])
      .to.matrix.equal([
        [1, 0, 0],
        [0, 2, 0],
        [0, 0, 3],
      ]);
  });
});
