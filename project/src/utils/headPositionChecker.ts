import { ImageProcessing } from './imageProcessing';

export interface HeadPositionResult {
  isAligned: boolean;
  centerX: number;
  centerY: number;
  offsetX: number;
  offsetY: number;
}

export class HeadPositionChecker {
  static checkHeadPosition(
    imageData: ImageData,
    screenWidth: number,
    screenHeight: number,
    tolerance: number = 0.2
  ): HeadPositionResult {
    const hsv = ImageProcessing.rgbToHsv(imageData);

    const skinMask = ImageProcessing.maskByColorRange(
      hsv,
      [0, 20, 70],
      [20, 255, 255]
    );

    const cleaned = ImageProcessing.erode(skinMask, 5);
    const enhanced = ImageProcessing.dilate(cleaned, 7);

    const contours = ImageProcessing.findContours(enhanced);

    if (contours.length === 0) {
      return {
        isAligned: false,
        centerX: screenWidth / 2,
        centerY: screenHeight / 2,
        offsetX: 0,
        offsetY: 0,
      };
    }

    const largestContour = contours.reduce((max, contour) =>
      contour.length > max.length ? contour : max
    );

    const center = ImageProcessing.fitEllipse(largestContour);

    if (!center) {
      return {
        isAligned: false,
        centerX: screenWidth / 2,
        centerY: screenHeight / 2,
        offsetX: 0,
        offsetY: 0,
      };
    }

    const [cx, cy] = center;

    const targetX = imageData.width / 2;
    const targetY = imageData.height / 2;

    const offsetX = Math.abs(cx - targetX);
    const offsetY = Math.abs(cy - targetY);

    const maxOffsetX = imageData.width * tolerance;
    const maxOffsetY = imageData.height * tolerance;

    const isAligned = offsetX <= maxOffsetX && offsetY <= maxOffsetY;

    return {
      isAligned,
      centerX: cx,
      centerY: cy,
      offsetX: offsetX / imageData.width,
      offsetY: offsetY / imageData.height,
    };
  }
}
