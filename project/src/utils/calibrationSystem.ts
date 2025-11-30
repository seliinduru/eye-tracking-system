import { PupilData } from './pupilDetector';

interface CalibrationSample {
  screen: [number, number];
  gazeVector: [number, number, number];
  pupil: [number, number];
}

interface MappingMatrix {
  xCoeffs: number[];
  yCoeffs: number[];
}

export class CalibrationSystem {
  private gazeSamples: CalibrationSample[] = [];
  private mappingMatrix: MappingMatrix | null = null;

  generateCalibrationPoints(
    screenWidth: number,
    screenHeight: number
  ): [number, number][] {
    const points: [number, number][] = [];
    const margin = 100;

    for (let row = 0; row < 4; row++) {
      const y = margin + (row * (screenHeight - 2 * margin)) / 3;
      for (let col = 0; col < 4; col++) {
        const x = margin + (col * (screenWidth - 2 * margin)) / 3;
        points.push([x, y]);
      }
    }

    const sequencePoints: [number, number][] = [
      [margin, screenHeight / 2],
      [screenWidth - margin, screenHeight / 2],
      [screenWidth / 2, margin],
      [screenWidth / 2, screenHeight - margin],
      [margin, margin],
      [screenWidth - margin, screenHeight - margin],
      [margin, screenHeight - margin],
      [screenWidth - margin, margin],
    ];

    points.push(...sequencePoints);

    return points;
  }

  addCalibrationSample(screenPoint: [number, number], pupilData: PupilData) {
    if (!pupilData.pupilCenter) return;

    const { pupilCenter, eyeCorners } = pupilData;
    const [leftCorner, rightCorner] = eyeCorners;

    if (leftCorner && rightCorner) {
      const gazeVector: [number, number, number] = [
        pupilCenter[0] - (leftCorner[0] + rightCorner[0]) / 2,
        pupilCenter[1] - (leftCorner[1] + rightCorner[1]) / 2,
        rightCorner[0] - leftCorner[0],
      ];

      this.gazeSamples.push({
        screen: screenPoint,
        gazeVector: gazeVector,
        pupil: pupilCenter,
      });
    }
  }

  computeMapping(): boolean {
    if (this.gazeSamples.length < 10) {
      return false;
    }

    const X: number[][] = [];
    const Yx: number[] = [];
    const Yy: number[] = [];

    for (const sample of this.gazeSamples) {
      const [gx, gy, gz] = sample.gazeVector;
      X.push([gx, gy, gz, gx * gy, 1]);
      Yx.push(sample.screen[0]);
      Yy.push(sample.screen[1]);
    }

    try {
      const coeffsX = this.leastSquares(X, Yx);
      const coeffsY = this.leastSquares(X, Yy);

      this.mappingMatrix = {
        xCoeffs: coeffsX,
        yCoeffs: coeffsY,
      };
      return true;
    } catch {
      return false;
    }
  }

  private leastSquares(X: number[][], Y: number[]): number[] {
    const n = X.length;
    const m = X[0].length;

    const XTX: number[][] = Array(m)
      .fill(null)
      .map(() => Array(m).fill(0));

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        for (let k = 0; k < n; k++) {
          XTX[i][j] += X[k][i] * X[k][j];
        }
      }
    }

    const XTY: number[] = Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      for (let k = 0; k < n; k++) {
        XTY[i] += X[k][i] * Y[k];
      }
    }

    return this.gaussElimination(XTX, XTY);
  }

  private gaussElimination(A: number[][], b: number[]): number[] {
    const n = A.length;
    const M = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
          maxRow = k;
        }
      }
      [M[i], M[maxRow]] = [M[maxRow], M[i]];

      if (Math.abs(M[i][i]) < 1e-10) continue;

      for (let k = i + 1; k < n; k++) {
        const factor = M[k][i] / M[i][i];
        for (let j = i; j <= n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }

    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      if (Math.abs(M[i][i]) < 1e-10) {
        x[i] = 0;
      } else {
        x[i] = M[i][n];
        for (let j = i + 1; j < n; j++) {
          x[i] -= M[i][j] * x[j];
        }
        x[i] /= M[i][i];
      }
    }

    return x;
  }

  mapGazeToScreen(pupilData: PupilData): [number, number] | null {
    if (!this.mappingMatrix || !pupilData.pupilCenter) return null;

    const { pupilCenter, eyeCorners } = pupilData;
    const [leftCorner, rightCorner] = eyeCorners;

    if (!leftCorner || !rightCorner) return null;

    const gazeVector: [number, number, number] = [
      pupilCenter[0] - (leftCorner[0] + rightCorner[0]) / 2,
      pupilCenter[1] - (leftCorner[1] + rightCorner[1]) / 2,
      rightCorner[0] - leftCorner[0],
    ];

    const features = [
      gazeVector[0],
      gazeVector[1],
      gazeVector[2],
      gazeVector[0] * gazeVector[1],
      1,
    ];

    const screenX = features.reduce(
      (acc, f, i) => acc + f * this.mappingMatrix!.xCoeffs[i],
      0
    );
    const screenY = features.reduce(
      (acc, f, i) => acc + f * this.mappingMatrix!.yCoeffs[i],
      0
    );

    return [screenX, screenY];
  }

  getSampleCount(): number {
    return this.gazeSamples.length;
  }
}
