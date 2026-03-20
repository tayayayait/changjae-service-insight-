import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

const MEDIAPIPE_WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const MEDIAPIPE_HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

type PalmErrorCode =
  | "PALM_INPUT_INVALID"
  | "PALM_QUALITY_LOW"
  | "PALM_BACKEND_UNAVAILABLE"
  | "PALM_ANALYSIS_TIMEOUT";

export type PalmHandedness = "left" | "right" | "unknown";

export interface PalmQualityMetrics {
  overall: number;
  reasons: string[];
  hand_detected: boolean;
  palm_centered: boolean;
  blur_score: number;
  exposure_score: number;
  palm_ratio: number;
  rotation_score: number;
}

/**
 * Phase 1 게이트키퍼 결과.
 * MediaPipe는 손 감지 + 이미지 품질 검증만 수행하고,
 * 실제 손금 선 분석은 Gemini Vision API가 담당합니다.
 */
export interface PalmGateResult {
  source: "mediapipe-gate-v2";
  handDetected: boolean;
  handedness: PalmHandedness;
  quality: PalmQualityMetrics;
  imageMeta: {
    width: number;
    height: number;
  };
}

/**
 * @deprecated Phase 1 이후로 features 필드는 사용되지 않습니다.
 * 하위 호환을 위해 유지하되, 빈 객체를 반환합니다.
 */
export interface PalmClientAnalysis {
  source: "mediapipe-client-v1";
  handedness: PalmHandedness;
  quality: PalmQualityMetrics;
  features: Record<string, number>;
  imageMeta: {
    width: number;
    height: number;
  };
}

export class PalmClientAnalysisError extends Error {
  code: PalmErrorCode;
  quality?: PalmQualityMetrics;

  constructor(code: PalmErrorCode, message: string, quality?: PalmQualityMetrics) {
    super(message);
    this.name = "PalmClientAnalysisError";
    this.code = code;
    this.quality = quality;
  }
}

type Point2D = { x: number; y: number };

let handLandmarkerPromise: Promise<HandLandmarker> | null = null;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const toPixelPoint = (
  landmark: NormalizedLandmark,
  width: number,
  height: number,
): Point2D => ({
  x: clamp(landmark.x, 0, 1) * width,
  y: clamp(landmark.y, 0, 1) * height,
});

const getBoundingBox = (points: Point2D[]) => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
};

const computeBlurScore = (pixels: ImageData) => {
  const { data, width, height } = pixels;
  const gray = new Float32Array(width * height);

  for (let i = 0; i < width * height; i += 1) {
    const idx = i * 4;
    gray[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        gray[index - 1] +
        gray[index + 1] +
        gray[index - width] +
        gray[index + width] -
        4 * gray[index];
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count += 1;
    }
  }

  if (!count) return 0;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return clamp(variance / 550, 0, 1);
};

const computeExposureScore = (pixels: ImageData) => {
  const { data } = pixels;
  let sum = 0;
  let overexposed = 0;
  let underexposed = 0;
  const pixelCount = data.length / 4;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    sum += luminance;
    if (luminance > 245) overexposed += 1;
    if (luminance < 20) underexposed += 1;
  }

  if (!pixelCount) return 0;

  const mean = sum / pixelCount / 255;
  const overRatio = overexposed / pixelCount;
  const underRatio = underexposed / pixelCount;
  const meanPenalty = Math.abs(mean - 0.52) * 1.55;
  const extremePenalty = (overRatio + underRatio) * 2.1;
  return clamp(1 - (meanPenalty + extremePenalty), 0, 1);
};

const computeRotationScore = (points: Point2D[]) => {
  const wrist = points[0];
  const middleMcp = points[9];
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const verticality = 1 - clamp(Math.abs(dx) / Math.max(Math.abs(dy), 1), 0, 1);
  return clamp(verticality, 0, 1);
};

const resolveHandedness = (categories: unknown): PalmHandedness => {
  if (!Array.isArray(categories) || categories.length === 0) return "unknown";
  const first = categories[0] as { categoryName?: unknown } | undefined;
  const raw = typeof first?.categoryName === "string" ? first.categoryName.toLowerCase() : "";
  if (raw === "left") return "left";
  if (raw === "right") return "right";
  return "unknown";
};

const loadImage = (imageData: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = imageData;
  });

const getHandLandmarker = async () => {
  if (typeof window === "undefined") {
    throw new PalmClientAnalysisError(
      "PALM_BACKEND_UNAVAILABLE",
      "손금 분석은 브라우저 환경에서만 사용할 수 있습니다.",
    );
  }

  if (handLandmarkerPromise) {
    return handLandmarkerPromise;
  }

  handLandmarkerPromise = (async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_ROOT);
      return await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_HAND_MODEL,
        },
        runningMode: "IMAGE",
        numHands: 1,
        minHandDetectionConfidence: 0.45,
        minHandPresenceConfidence: 0.45,
        minTrackingConfidence: 0.45,
      });
    } catch (error) {
      handLandmarkerPromise = null;
      throw new PalmClientAnalysisError(
        "PALM_BACKEND_UNAVAILABLE",
        error instanceof Error
          ? `MediaPipe 초기화에 실패했습니다: ${error.message}`
          : "MediaPipe 초기화에 실패했습니다.",
      );
    }
  })();

  return handLandmarkerPromise;
};

const ensureCanvas = (image: HTMLImageElement) => {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new PalmClientAnalysisError(
      "PALM_BACKEND_UNAVAILABLE",
      "브라우저 캔버스 컨텍스트를 사용할 수 없습니다.",
    );
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return { canvas, context, imageData };
};

const buildQualityMetrics = (
  points: Point2D[],
  imageWidth: number,
  imageHeight: number,
  blurScore: number,
  exposureScore: number,
  handDetected: boolean,
) => {
  if (!handDetected) {
    return {
      overall: 0,
      reasons: ["손이 감지되지 않았습니다."],
      hand_detected: false,
      palm_centered: false,
      blur_score: blurScore,
      exposure_score: exposureScore,
      palm_ratio: 0,
      rotation_score: 0,
    } satisfies PalmQualityMetrics;
  }

  const bbox = getBoundingBox(points);
  const centerX = (bbox.minX + bbox.maxX) / 2;
  const centerY = (bbox.minY + bbox.maxY) / 2;
  const imageCenterX = imageWidth / 2;
  const imageCenterY = imageHeight / 2;
  const distanceToCenter = Math.hypot(centerX - imageCenterX, centerY - imageCenterY);
  const maxDistance = Math.hypot(imageCenterX, imageCenterY);
  const centerScore = clamp(1 - distanceToCenter / maxDistance, 0, 1);
  const palmRatio = clamp((bbox.width * bbox.height) / (imageWidth * imageHeight), 0, 1);
  const ratioScore =
    palmRatio < 0.12 ? palmRatio / 0.12 : palmRatio > 0.75 ? clamp(1 - (palmRatio - 0.75) * 2, 0, 1) : 1;
  const rotationScore = computeRotationScore(points);
  const palmCentered = centerScore >= 0.56 && palmRatio >= 0.12;

  const overall = clamp(
    blurScore * 0.3 +
      exposureScore * 0.2 +
      centerScore * 0.3 +
      ratioScore * 0.1 +
      rotationScore * 0.1,
    0,
    1,
  );

  const reasons: string[] = [];
  if (blurScore < 0.35) reasons.push("이미지가 흐립니다.");
  if (exposureScore < 0.35) reasons.push("조명이 너무 어둡거나 밝습니다.");
  if (centerScore < 0.56) reasons.push("손바닥을 화면 중앙에 맞춰주세요.");
  if (palmRatio < 0.12) reasons.push("손이 너무 멀리 있습니다.");
  if (rotationScore < 0.35) reasons.push("손바닥을 정면으로 펴서 촬영해 주세요.");

  return {
    overall,
    reasons,
    hand_detected: true,
    palm_centered: palmCentered,
    blur_score: blurScore,
    exposure_score: exposureScore,
    palm_ratio: palmRatio,
    rotation_score: rotationScore,
  } satisfies PalmQualityMetrics;
};

/**
 * 게이트키퍼 분석: 손 감지 + 이미지 품질 검증만 수행합니다.
 * 실제 손금 선 분석은 Gemini Vision API에서 수행됩니다.
 */
export const analyzePalmGate = async (
  imageData: string,
): Promise<PalmGateResult> => {
  if (!imageData || !imageData.startsWith("data:image/")) {
    throw new PalmClientAnalysisError(
      "PALM_INPUT_INVALID",
      "유효한 손바닥 이미지 데이터가 필요합니다.",
    );
  }

  const image = await loadImage(imageData);
  const { imageData: pixels } = ensureCanvas(image);
  const blurScore = computeBlurScore(pixels);
  const exposureScore = computeExposureScore(pixels);

  const handLandmarker = await getHandLandmarker();
  const detectionResult = handLandmarker.detect(image);
  const landmarks = detectionResult.landmarks?.[0];

  if (!landmarks?.length) {
    const quality = buildQualityMetrics([], pixels.width, pixels.height, blurScore, exposureScore, false);
    throw new PalmClientAnalysisError(
      "PALM_INPUT_INVALID",
      "손이 감지되지 않았습니다. 손바닥이 정면으로 보이도록 다시 촬영해 주세요.",
      quality,
    );
  }

  const points = landmarks.map((landmark) =>
    toPixelPoint(landmark, pixels.width, pixels.height),
  );
  const quality = buildQualityMetrics(
    points,
    pixels.width,
    pixels.height,
    blurScore,
    exposureScore,
    true,
  );
  const handedness = resolveHandedness(detectionResult.handedness?.[0]);

  return {
    source: "mediapipe-gate-v2",
    handDetected: true,
    handedness,
    quality,
    imageMeta: {
      width: pixels.width,
      height: pixels.height,
    },
  };
};

/**
 * @deprecated Phase 1 이후 `analyzePalmGate`를 사용하세요.
 * 하위 호환을 위해 유지합니다. features는 빈 객체를 반환합니다.
 */
export const analyzePalmImageClient = async (
  imageData: string,
): Promise<PalmClientAnalysis> => {
  const gateResult = await analyzePalmGate(imageData);
  return {
    source: "mediapipe-client-v1",
    handedness: gateResult.handedness,
    quality: gateResult.quality,
    features: {},
    imageMeta: gateResult.imageMeta,
  };
};
