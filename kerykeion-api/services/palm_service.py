from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple
import os
import time

import cv2
import numpy as np

try:
    import torch
except Exception:  # pragma: no cover - optional dependency at runtime
    torch = None

try:
    import segmentation_models_pytorch as smp
except Exception:  # pragma: no cover - optional dependency at runtime
    smp = None

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover - optional dependency at runtime
    genai = None

try:
    import mediapipe as mp
except Exception:  # pragma: no cover - optional dependency at runtime
    mp = None

from palm_model.feature_extraction import classify_palm, extract_palm_features


MIN_QUALITY_SCORE = 0.45


@dataclass
class HandDetection:
    handedness: str
    landmarks: Optional[np.ndarray]
    bbox: Optional[Tuple[int, int, int, int]]


def _to_builtin_number(value: Any) -> float:
    try:
        return float(value)
    except Exception:
        return 0.0


class PalmService:
    def __init__(self, model_path: str = "results/best_model.pth", api_key: Optional[str] = None):
        self.model_path = model_path
        self.classes = ["Background", "Life Line", "Head Line", "Heart Line"]
        self.device = "cuda" if torch is not None and torch.cuda.is_available() else "cpu"
        self.model_status = "not_loaded"
        self.model = self._load_model()
        self.gemini_model = self._configure_gemini(api_key)
        self.mp_hands = mp.solutions.hands if mp is not None else None

    def health_status(self) -> Dict[str, Any]:
        return {
            "model_loaded": self.model is not None,
            "model_status": self.model_status,
            "model_path": self.model_path,
            "mediapipe_enabled": self.mp_hands is not None,
            "gemini_enabled": self.gemini_model is not None,
            "device": self.device,
        }

    def analyze_palm(self, image_bytes: bytes) -> Dict[str, Any]:
        started = time.time()
        if not image_bytes:
            return self._error("PALM_INPUT_INVALID", "Image payload is empty.")

        decoded = self._decode_image(image_bytes)
        if decoded is None:
            return self._error("PALM_INPUT_INVALID", "Image could not be decoded.")

        precheck = self._precheck(decoded)
        quality = precheck["quality"]
        if not quality["hand_detected"]:
            return self._error("PALM_INPUT_INVALID", "No hand was detected in the image.", quality=quality)
        if quality["overall"] < MIN_QUALITY_SCORE:
            return self._error(
                "PALM_QUALITY_LOW",
                "Image quality is too low for stable palm line extraction.",
                quality=quality,
            )

        rectified = self._rectify_palm(decoded, precheck["detection"])
        if rectified is None:
            return self._error("PALM_INPUT_INVALID", "Palm region could not be normalized.", quality=quality)

        segmentation_mask = self._extract_line_mask(rectified)
        if segmentation_mask is None:
            return self._error("PALM_BACKEND_UNAVAILABLE", "Palm analysis backend is unavailable.", quality=quality)

        features = self._build_features(segmentation_mask)
        classification = classify_palm(features)

        classification_confidence = _to_builtin_number(classification.get("confidence", 0.0))
        pipeline_confidence = float(round((classification_confidence * 0.6) + (quality["overall"] * 0.4), 3))
        classification["confidence"] = pipeline_confidence
        features["confidence"] = pipeline_confidence

        interpretation = self._build_interpretation(features, classification, quality)

        return {
            "features": features,
            "classification": classification,
            "interpretation": interpretation,
            "quality": quality,
            "handedness": precheck["detection"].handedness,
            "elapsed_ms": int((time.time() - started) * 1000),
        }

    def _configure_gemini(self, api_key: Optional[str]):
        if not api_key or genai is None:
            return None
        try:
            genai.configure(api_key=api_key)
            return genai.GenerativeModel("gemini-1.5-pro")
        except Exception:
            return None

    def _load_model(self):
        if torch is None or smp is None:
            self.model_status = "dependencies_missing"
            return None

        valid_model, reason = self._validate_model_file(self.model_path)
        if not valid_model:
            self.model_status = reason
            return None

        try:
            model = smp.Unet(
                encoder_name="resnet18",
                encoder_weights=None,
                in_channels=3,
                classes=len(self.classes),
            )
            checkpoint = torch.load(self.model_path, map_location=self.device)
            if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                checkpoint = checkpoint["state_dict"]
            model.load_state_dict(checkpoint)
            model.to(self.device).eval()
            self.model_status = "loaded"
            return model
        except Exception as exc:
            self.model_status = f"load_failed:{exc.__class__.__name__}"
            return None

    def _validate_model_file(self, model_path: str) -> Tuple[bool, str]:
        if not os.path.exists(model_path):
            return False, "missing_model_file"

        try:
            file_size = os.path.getsize(model_path)
        except OSError:
            return False, "model_file_unreadable"

        if file_size < 1024:
            return False, "model_file_too_small"

        try:
            with open(model_path, "rb") as fp:
                header = fp.read(200).decode("utf-8", errors="ignore").lower()
        except OSError:
            return False, "model_file_unreadable"

        if "<!doctype html" in header or "<html" in header:
            return False, "invalid_model_file_html"

        return True, "ok"

    def _decode_image(self, image_bytes: bytes) -> Optional[np.ndarray]:
        nparr = np.frombuffer(image_bytes, np.uint8)
        bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if bgr is None:
            return None
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    def _precheck(self, img_rgb: np.ndarray) -> Dict[str, Any]:
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        blur_score = float(np.clip(blur_var / 250.0, 0.0, 1.0))

        exposure_mean = float(np.mean(gray))
        exposure_score = float(np.clip(1.0 - abs(exposure_mean - 127.5) / 127.5, 0.0, 1.0))

        detection = self._detect_hand(img_rgb)
        palm_centered, center_score, hand_coverage = self._calc_center_quality(img_rgb.shape, detection.bbox)
        coverage_score = float(np.clip((hand_coverage - 0.1) / 0.45, 0.0, 1.0))

        detect_score = 1.0 if detection.bbox is not None else 0.0
        overall = (
            detect_score * 0.40
            + blur_score * 0.22
            + exposure_score * 0.18
            + center_score * 0.12
            + coverage_score * 0.08
        )
        overall = float(np.clip(overall, 0.0, 1.0))

        reasons = []
        if detect_score == 0.0:
            reasons.append("No hand detected")
        if blur_score < 0.20:
            reasons.append("Image is blurred")
        if exposure_score < 0.30:
            reasons.append("Exposure is too dark or too bright")
        if not palm_centered:
            reasons.append("Palm is not centered")
        if hand_coverage < 0.12:
            reasons.append("Palm area is too small in frame")

        quality = {
            "overall": round(overall, 3),
            "reasons": reasons,
            "hand_detected": detect_score == 1.0,
            "palm_centered": palm_centered,
            "blur_score": round(blur_score, 3),
            "exposure_score": round(exposure_score, 3),
        }

        return {
            "quality": quality,
            "detection": detection,
        }

    def _detect_hand(self, img_rgb: np.ndarray) -> HandDetection:
        if self.mp_hands is not None:
            try:
                with self.mp_hands.Hands(
                    static_image_mode=True,
                    max_num_hands=1,
                    min_detection_confidence=0.45,
                    min_tracking_confidence=0.45,
                ) as hands:
                    result = hands.process(img_rgb)
                    if result.multi_hand_landmarks:
                        hand_landmarks = result.multi_hand_landmarks[0]
                        height, width = img_rgb.shape[:2]
                        points = np.array(
                            [[lm.x * width, lm.y * height] for lm in hand_landmarks.landmark],
                            dtype=np.float32,
                        )
                        min_xy = np.maximum(np.min(points, axis=0) - 12, [0, 0]).astype(int)
                        max_xy = np.minimum(np.max(points, axis=0) + 12, [width - 1, height - 1]).astype(int)
                        handedness = "unknown"
                        if result.multi_handedness:
                            raw = result.multi_handedness[0].classification[0].label.lower()
                            handedness = "left" if raw == "left" else "right" if raw == "right" else "unknown"
                        return HandDetection(
                            handedness=handedness,
                            landmarks=points,
                            bbox=(int(min_xy[0]), int(min_xy[1]), int(max_xy[0]), int(max_xy[1])),
                        )
            except Exception:
                pass

        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return HandDetection(handedness="unknown", landmarks=None, bbox=None)

        contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(contour)
        area_ratio = (w * h) / float(img_rgb.shape[0] * img_rgb.shape[1])
        if area_ratio < 0.08:
            return HandDetection(handedness="unknown", landmarks=None, bbox=None)
        return HandDetection(handedness="unknown", landmarks=None, bbox=(x, y, x + w, y + h))

    def _calc_center_quality(
        self,
        image_shape: Tuple[int, ...],
        bbox: Optional[Tuple[int, int, int, int]],
    ) -> Tuple[bool, float, float]:
        if bbox is None:
            return False, 0.0, 0.0

        h, w = image_shape[:2]
        x1, y1, x2, y2 = bbox
        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0
        norm_dx = abs(cx - (w / 2.0)) / max(w / 2.0, 1.0)
        norm_dy = abs(cy - (h / 2.0)) / max(h / 2.0, 1.0)
        dist = float(np.hypot(norm_dx, norm_dy))
        centered = dist <= 0.32
        center_score = float(np.clip(1.0 - (dist / 0.75), 0.0, 1.0))
        coverage = ((x2 - x1) * (y2 - y1)) / float(w * h)
        return centered, center_score, coverage

    def _rectify_palm(self, img_rgb: np.ndarray, detection: HandDetection) -> Optional[np.ndarray]:
        h, w = img_rgb.shape[:2]
        working = img_rgb
        landmarks = detection.landmarks
        bbox = detection.bbox

        if landmarks is not None and len(landmarks) > 9:
            wrist = landmarks[0]
            middle_mcp = landmarks[9]
            angle = np.degrees(np.arctan2(middle_mcp[1] - wrist[1], middle_mcp[0] - wrist[0]))
            rotate_by = angle + 90.0
            center = (w / 2.0, h / 2.0)
            rot = cv2.getRotationMatrix2D(center, rotate_by, 1.0)
            working = cv2.warpAffine(
                working,
                rot,
                (w, h),
                flags=cv2.INTER_LINEAR,
                borderMode=cv2.BORDER_REPLICATE,
            )
            pts = np.concatenate([landmarks, np.ones((landmarks.shape[0], 1), dtype=np.float32)], axis=1)
            rotated_pts = (rot @ pts.T).T
            min_xy = np.maximum(np.min(rotated_pts, axis=0) - 18, [0, 0]).astype(int)
            max_xy = np.minimum(np.max(rotated_pts, axis=0) + 18, [w - 1, h - 1]).astype(int)
            bbox = (int(min_xy[0]), int(min_xy[1]), int(max_xy[0]), int(max_xy[1]))

        if bbox is None:
            return None

        x1, y1, x2, y2 = bbox
        pad_x = int((x2 - x1) * 0.22)
        pad_y = int((y2 - y1) * 0.22)
        x1 = max(0, x1 - pad_x)
        y1 = max(0, y1 - pad_y)
        x2 = min(working.shape[1] - 1, x2 + pad_x)
        y2 = min(working.shape[0] - 1, y2 + pad_y)
        crop = working[y1:y2, x1:x2]
        if crop.size == 0:
            return None
        return cv2.resize(crop, (256, 256), interpolation=cv2.INTER_AREA)

    def _extract_line_mask(self, palm_rgb: np.ndarray) -> Optional[np.ndarray]:
        if self.model is not None and torch is not None:
            try:
                img_np = palm_rgb.astype(np.float32) / 255.0
                tensor = torch.from_numpy(img_np).permute(2, 0, 1).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    output = self.model(tensor)
                    mask = torch.argmax(output, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)
                if int(np.max(mask)) > 0:
                    return mask
            except Exception:
                pass

        return self._extract_mask_without_model(palm_rgb)

    def _extract_mask_without_model(self, palm_rgb: np.ndarray) -> Optional[np.ndarray]:
        gray = cv2.cvtColor(palm_rgb, cv2.COLOR_RGB2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        eq = clahe.apply(gray)
        filtered = cv2.GaussianBlur(eq, (5, 5), 0)
        line_enhanced = cv2.adaptiveThreshold(
            255,
            filtered,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            25,
            6,
        )
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        line_enhanced = cv2.morphologyEx(line_enhanced, cv2.MORPH_OPEN, kernel, iterations=1)

        y_idx, x_idx = np.where(line_enhanced > 0)
        if len(y_idx) < 80:
            return None

        segmentation = np.zeros_like(line_enhanced, dtype=np.uint8)
        h, w = segmentation.shape
        for y, x in zip(y_idx, x_idx):
            if y < int(h * 0.38):
                segmentation[y, x] = 3  # heart
            elif y < int(h * 0.62):
                segmentation[y, x] = 2  # head
            elif x < int(w * 0.7):
                segmentation[y, x] = 1  # life

        return segmentation

    def _line_break_count(self, mask: np.ndarray) -> int:
        binary = (mask > 0).astype(np.uint8)
        labels, _ = cv2.connectedComponents(binary)
        if labels <= 1:
            return 0
        return max(0, labels - 2)

    def _build_features(self, segmentation_mask: np.ndarray) -> Dict[str, float]:
        raw_features = extract_palm_features(segmentation_mask)
        life_mask = (segmentation_mask == 1).astype(np.uint8)
        head_mask = (segmentation_mask == 2).astype(np.uint8)
        heart_mask = (segmentation_mask == 3).astype(np.uint8)

        normalized = {key: round(_to_builtin_number(value), 3) for key, value in raw_features.items()}
        normalized["life_break_count"] = float(self._line_break_count(life_mask))
        normalized["head_break_count"] = float(self._line_break_count(head_mask))
        normalized["heart_break_count"] = float(self._line_break_count(heart_mask))
        normalized["break_count"] = float(
            normalized["life_break_count"] + normalized["head_break_count"] + normalized["heart_break_count"]
        )
        curvature_avg = np.mean(
            [
                normalized.get("life_curvature", 0.0),
                normalized.get("head_curvature", 0.0),
                normalized.get("heart_curvature", 0.0),
            ]
        )
        normalized["curvature"] = round(float(curvature_avg), 3)
        return normalized

    def _build_interpretation(
        self,
        features: Dict[str, float],
        classification: Dict[str, Any],
        quality: Dict[str, Any],
    ) -> str:
        if self.gemini_model is None:
            return self._deterministic_interpretation(features, classification, quality)

        prompt = f"""
You are a palm analysis narrator.
Use only the provided structured data and do not invent extra signs.
Write 4 short sentences in Korean.
Tone: indicator-based and practical, not prophetic.

classification={classification}
quality={quality}
features={features}
"""
        try:
            response = self.gemini_model.generate_content(prompt)
            text = getattr(response, "text", None)
            if isinstance(text, str) and text.strip():
                return text.strip()
        except Exception:
            pass
        return self._deterministic_interpretation(features, classification, quality)

    def _deterministic_interpretation(
        self,
        features: Dict[str, float],
        classification: Dict[str, Any],
        quality: Dict[str, Any],
    ) -> str:
        dominant = classification.get("dominant_line", "Unknown")
        palm_type = classification.get("palm_type", "unclassified")
        confidence = _to_builtin_number(classification.get("confidence", 0.0))
        life = _to_builtin_number(features.get("life_length", 0.0))
        head = _to_builtin_number(features.get("head_length", 0.0))
        heart = _to_builtin_number(features.get("heart_length", 0.0))
        break_count = _to_builtin_number(features.get("break_count", 0.0))
        quality_score = _to_builtin_number(quality.get("overall", 0.0))

        return (
            f"주요 선 길이 지표는 생명선 {life:.0f}, 지능선 {head:.0f}, 감정선 {heart:.0f}입니다. "
            f"지배 선은 {dominant}로 분류되었고 전체 타입은 {palm_type}입니다. "
            f"선 단절 신호 합계는 {break_count:.0f}이며 분류 신뢰도는 {confidence:.2f}입니다. "
            f"이미지 품질 점수 {quality_score:.2f} 기준으로 현재 결과는 지표 해석용으로 사용 가능합니다."
        )

    def _error(self, code: str, message: str, quality: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "error": {
                "code": code,
                "message": message,
            }
        }
        if quality is not None:
            payload["error"]["quality"] = quality
        return payload
