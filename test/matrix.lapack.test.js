import { expect } from 'chai';
import { Matrix } from '../src';

describe('matrix', () => {
  describe('LU decomp', () => {
    it('should perform LU decomp on rectangular matrices', () => {
      const D = Matrix.create([
        [3, 6],
        [2, 3],
        [4, 3],
        [2, 120]
      ]);

      const lu = D.luPack();
      expect(lu.P.x((lu.L.x(lu.U))).eql(D)).to.be.true;
    });

    it('should match LU JS to LAPACK', () => {
      const A = Matrix.create([
        [4, 2, 1, 4],
        [-9, 4, 3, 9],
        [11, 3, 11, 3],
        [-4, 5, 3, 1]
      ]);

      expect(A.luJs().U.approxEql(A.luPack().U)).to.be.true;
      expect(A.luJs().L.approxEql(A.luPack().L)).to.be.true;
    });
  });

  const ASVD = Matrix.create([
    [1, -1, 2, 2],
    [-1, 2, 1, -1],
    [2, 1, 3, 2],
    [2, -1, 2, 1]
  ]);

  it('should have matching svds for js and lapack', () => {
    const svdJs = ASVD.svdJs();
    const svdPack = ASVD.svdPack();

    expect(svdJs.U.eql(svdPack.U)).to.be.true;
    expect(svdJs.S.eql(svdPack.S)).to.be.true;
    expect(svdJs.V.eql(svdPack.V)).to.be.true;
  });

  const QRin = Matrix.create([
    [1, -1, 2, 2],
    [-1, 2, 1, -1],
    [2, 1, 3, 2],
    [2, -1, 2, 1]
  ]);

  const Qout = Matrix.create([
    [-0.316227766016838, 0.28342171556262064, 0.8226876614429064, -0.3779644730092273],
    [0.31622776601683794, -0.6883098806520787, 0.5323273103454103, 0.3779644730092272],
    [-0.6324555320336759, -0.6478210641431328, -0.19357356739833098, -0.37796447300922714],
    [-0.6324555320336759, 0.16195526603578317, 0.048393391849582745, 0.7559289460184544]
  ]);

  const Rout = Matrix.create([
    [-3.1622776601683795, 0.9486832980505139, -3.478505426185217, -2.8460498941515415],
    [1.91055907392895e-17, -2.4698178070456938, -1.7410191098846692, 0.1214664495268375],
    [-2.254600901479451e-16, 2.0686390257580927e-16, 1.6937687147353957, 0.7742942695933234],
    [3.446764628337833e-17, 8.098938594673387e-17, 2.220446049250313e-16, -1.1338934190276815]
  ]);

  it('should qr from lapack', () => {
    const qr = QRin.qrPack();
    expect(qr.Q).to.matrix.equal(Qout);
    expect(qr.R).to.matrix.equal(Rout);
  });
});
