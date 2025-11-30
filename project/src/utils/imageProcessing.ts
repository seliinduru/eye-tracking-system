export class ImageProcessing {
  static rgbToGray(imageData: ImageData): number[][] {
    const { width, height, data } = imageData;
    const gray: number[][] = [];

    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        row.push(Math.floor(0.299 * r + 0.587 * g + 0.114 * b));
      }
      gray.push(row);
    }

    return gray;
  }

  static manualThreshold(gray: number[][], threshold: number): number[][] {
    const height = gray.length;
    const width = gray[0].length;
    const binary: number[][] = [];

    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        row.push(gray[i][j] < threshold ? 255 : 0);
      }
      binary.push(row);
    }

    return binary;
  }

  static computeHistogram(gray: number[][]): number[] {
    const hist = new Array(256).fill(0);
    for (const row of gray) {
      for (const val of row) {
        hist[val]++;
      }
    }
    return hist;
  }

  static otsuThreshold(gray: number[][]): number[][] {
    const hist = this.computeHistogram(gray);
    const totalPixels = gray.length * gray[0].length;

    const sumTotal = hist.reduce((acc, val, idx) => acc + idx * val, 0);
    let sumBackground = 0;
    let weightBackground = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
      weightBackground += hist[t];
      if (weightBackground === 0) continue;

      const weightForeground = totalPixels - weightBackground;
      if (weightForeground === 0) break;

      sumBackground += t * hist[t];
      const meanBackground = sumBackground / weightBackground;
      const meanForeground = (sumTotal - sumBackground) / weightForeground;

      const variance =
        weightBackground *
        weightForeground *
        Math.pow(meanBackground - meanForeground, 2);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }

    return this.manualThreshold(gray, threshold);
  }

  static adaptiveThreshold(
    gray: number[][],
    blockSize: number = 15,
    c: number = 2
  ): number[][] {
    const height = gray.length;
    const width = gray[0].length;
    const binary: number[][] = [];
    const halfBlock = Math.floor(blockSize / 2);

    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        const iStart = Math.max(0, i - halfBlock);
        const iEnd = Math.min(height, i + halfBlock + 1);
        const jStart = Math.max(0, j - halfBlock);
        const jEnd = Math.min(width, j + halfBlock + 1);

        let localSum = 0;
        let count = 0;
        for (let ii = iStart; ii < iEnd; ii++) {
          for (let jj = jStart; jj < jEnd; jj++) {
            localSum += gray[ii][jj];
            count++;
          }
        }

        const localMean = localSum / count;
        row.push(gray[i][j] < localMean - c ? 255 : 0);
      }
      binary.push(row);
    }

    return binary;
  }

  static clahe(
    gray: number[][],
    clipLimit: number = 2.0,
    tileSize: number = 8
  ): number[][] {
    const height = gray.length;
    const width = gray[0].length;
    const tilesY = Math.floor(height / tileSize);
    const tilesX = Math.floor(width / tileSize);

    const enhanced = gray.map((row) => [...row]);

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const yStart = ty * tileSize;
        const yEnd = Math.min((ty + 1) * tileSize, height);
        const xStart = tx * tileSize;
        const xEnd = Math.min((tx + 1) * tileSize, width);

        const hist = new Array(256).fill(0);
        for (let i = yStart; i < yEnd; i++) {
          for (let j = xStart; j < xEnd; j++) {
            hist[gray[i][j]]++;
          }
        }

        const totalPixels = (yEnd - yStart) * (xEnd - xStart);
        const clipThreshold = Math.floor((clipLimit * totalPixels) / 256);

        let excess = 0;
        for (let i = 0; i < 256; i++) {
          if (hist[i] > clipThreshold) {
            excess += hist[i] - clipThreshold;
            hist[i] = clipThreshold;
          }
        }

        const redistribute = Math.floor(excess / 256);
        for (let i = 0; i < 256; i++) {
          hist[i] += redistribute;
        }

        const cdf = new Array(256).fill(0);
        cdf[0] = hist[0];
        for (let i = 1; i < 256; i++) {
          cdf[i] = cdf[i - 1] + hist[i];
        }

        if (cdf[255] > 0) {
          for (let i = yStart; i < yEnd; i++) {
            for (let j = xStart; j < xEnd; j++) {
              enhanced[i][j] = Math.floor((cdf[gray[i][j]] / cdf[255]) * 255);
            }
          }
        }
      }
    }

    return enhanced;
  }

  static erode(binary: number[][], kernelSize: number = 3): number[][] {
    const height = binary.length;
    const width = binary[0].length;
    const result: number[][] = [];
    const halfK = Math.floor(kernelSize / 2);

    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        if (i < halfK || i >= height - halfK || j < halfK || j >= width - halfK) {
          row.push(0);
          continue;
        }

        let minVal = 255;
        for (let ki = -halfK; ki <= halfK; ki++) {
          for (let kj = -halfK; kj <= halfK; kj++) {
            minVal = Math.min(minVal, binary[i + ki][j + kj]);
          }
        }
        row.push(minVal);
      }
      result.push(row);
    }

    return result;
  }

  static dilate(binary: number[][], kernelSize: number = 3): number[][] {
    const height = binary.length;
    const width = binary[0].length;
    const result: number[][] = [];
    const halfK = Math.floor(kernelSize / 2);

    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        if (i < halfK || i >= height - halfK || j < halfK || j >= width - halfK) {
          row.push(0);
          continue;
        }

        let maxVal = 0;
        for (let ki = -halfK; ki <= halfK; ki++) {
          for (let kj = -halfK; kj <= halfK; kj++) {
            maxVal = Math.max(maxVal, binary[i + ki][j + kj]);
          }
        }
        row.push(maxVal);
      }
      result.push(row);
    }

    return result;
  }

  static sobelEdges(gray: number[][]): number[][] {
    const height = gray.length;
    const width = gray[0].length;
    const edges: number[][] = [];

    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];

    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        if (i === 0 || i === height - 1 || j === 0 || j === width - 1) {
          row.push(0);
          continue;
        }

        let gx = 0;
        let gy = 0;
        for (let ki = -1; ki <= 1; ki++) {
          for (let kj = -1; kj <= 1; kj++) {
            const pixel = gray[i + ki][j + kj];
            gx += pixel * sobelX[ki + 1][kj + 1];
            gy += pixel * sobelY[ki + 1][kj + 1];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        row.push(Math.min(255, Math.floor(magnitude)));
      }
      edges.push(row);
    }

    return edges;
  }

  static findContours(binary: number[][]): number[][][] {
    const height = binary.length;
    const width = binary[0].length;
    const visited: boolean[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false));
    const contours: number[][][] = [];

    const floodFill = (startI: number, startJ: number): number[][] => {
      const stack: [number, number][] = [[startI, startJ]];
      const points: number[][] = [];

      while (stack.length > 0) {
        const [i, j] = stack.pop()!;
        if (i < 0 || i >= height || j < 0 || j >= width) continue;
        if (visited[i][j] || binary[i][j] === 0) continue;

        visited[i][j] = true;
        points.push([i, j]);

        stack.push([i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]);
      }

      return points;
    };

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (binary[i][j] === 255 && !visited[i][j]) {
          const contour = floodFill(i, j);
          if (contour.length > 50) {
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  }

  static fitEllipse(points: number[][]): [number, number] | null {
    if (points.length < 5) return null;

    const n = points.length;
    const sumX = points.reduce((acc, p) => acc + p[1], 0);
    const sumY = points.reduce((acc, p) => acc + p[0], 0);
    const cx = sumX / n;
    const cy = sumY / n;

    return [cx, cy];
  }

  static cropEyeRegion(
    gray: number[][],
    x: number,
    y: number,
    w: number,
    h: number
  ): number[][] {
    const height = gray.length;
    const width = gray[0].length;
    const x1 = Math.max(0, Math.floor(x));
    const y1 = Math.max(0, Math.floor(y));
    const x2 = Math.min(width, Math.floor(x + w));
    const y2 = Math.min(height, Math.floor(y + h));

    const cropped: number[][] = [];
    for (let i = y1; i < y2; i++) {
      const row: number[] = [];
      for (let j = x1; j < x2; j++) {
        row.push(gray[i][j]);
      }
      cropped.push(row);
    }

    return cropped.length > 0 && cropped[0].length > 0 ? cropped : [[128]];
  }
}
