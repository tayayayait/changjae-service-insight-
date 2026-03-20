"""
손금 세그멘테이션 마스크에서 특징을 추출합니다.
선 길이, 곡률, 각도, 교차점 등의 기하학적 특징을 계산합니다.
"""

import cv2
import numpy as np

def extract_skeleton(mask):
    """모폴로지 연산을 통해 이진 마스크의 스켈레톤(뼈대)을 추출합니다."""
    mask_binary = (mask > 0).astype(np.uint8)
    skeleton = cv2.ximgproc.thinning(mask_binary * 255) if hasattr(cv2, 'ximgproc') else mask_binary
    return skeleton

def get_line_length(mask):
    """마스크 내 선의 픽셀 길이를 근사치로 계산합니다."""
    if mask.max() == 0: return 0
    binary_mask = (mask > 0).astype(np.uint8) * 255
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if len(contours) == 0: return 0
    longest_contour = max(contours, key=cv2.contourArea)
    return cv2.arcLength(longest_contour, closed=False)

def get_curvature(mask):
    """선의 곡률(Tortuosity)을 계산합니다. (실제 길이 / 직선 거리)"""
    if mask.max() == 0: return 0
    binary_mask = (mask > 0).astype(np.uint8) * 255
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if len(contours) == 0: return 0
    longest_contour = max(contours, key=cv2.contourArea)
    arc_length = cv2.arcLength(longest_contour, closed=False)
    contour_points = longest_contour.reshape(-1, 2)
    if len(contour_points) < 2: return 0
    start, end = contour_points[0], contour_points[-1]
    straight_distance = np.linalg.norm(start - end)
    return arc_length / straight_distance if straight_distance >= 1 else 1.0

def get_line_angle(mask):
    """수평축 대비 선의 각도를 계산합니다."""
    if mask.max() == 0: return 0
    binary_mask = (mask > 0).astype(np.uint8) * 255
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if len(contours) == 0: return 0
    longest_contour = max(contours, key=cv2.contourArea)
    [vx, vy, x, y] = cv2.fitLine(longest_contour, cv2.DIST_L2, 0, 0.01, 0.01)
    return float(np.arctan2(vy, vx) * 180 / np.pi)

def count_intersections(mask1, mask2):
    """두 선 마스크 사이의 교차 영역 수를 계산합니다."""
    intersection = cv2.bitwise_and(mask1, mask2)
    if intersection.max() == 0: return 0
    num_labels, _ = cv2.connectedComponents(intersection)
    return max(0, num_labels - 1)

def extract_palm_features(segmentation_mask):
    """전체 손금 마스크에서 모든 특징을 추출합니다 (생명선, 두뇌선, 감정선)."""
    life_mask = (segmentation_mask == 1).astype(np.uint8) * 255
    head_mask = (segmentation_mask == 2).astype(np.uint8) * 255
    heart_mask = (segmentation_mask == 3).astype(np.uint8) * 255
    
    features = {
        'life_length': get_line_length(life_mask),
        'head_length': get_line_length(head_mask),
        'heart_length': get_line_length(heart_mask),
        'life_curvature': get_curvature(life_mask),
        'head_curvature': get_curvature(head_mask),
        'heart_curvature': get_curvature(heart_mask),
        'life_angle': get_line_angle(life_mask),
        'head_angle': get_line_angle(head_mask),
        'heart_angle': get_line_angle(heart_mask),
        'life_head_intersection': count_intersections(life_mask, head_mask),
        'life_heart_intersection': count_intersections(life_mask, heart_mask),
        'head_heart_intersection': count_intersections(head_mask, heart_mask)
    }
    return features

def classify_palm(features):
    """추출된 특징을 기반으로 손금을 1차 분류합니다."""
    classification = {}
    lengths = {'Life': features.get('life_length', 0), 'Head': features.get('head_length', 0), 'Heart': features.get('heart_length', 0)}
    total_length = sum(lengths.values())
    if total_length > 0:
        dominant_line = max(lengths, key=lengths.get)
        classification['dominant_line'] = dominant_line
        classification['confidence'] = round(lengths[dominant_line] / total_length, 3)
    
    avg_curvature = (features.get('life_curvature', 0) + features.get('head_curvature', 0) + features.get('heart_curvature', 0)) / 3
    if avg_curvature > 1.3: classification['palm_type'] = '곡선형/표현형'
    elif avg_curvature > 1.1: classification['palm_type'] = '균형형'
    else: classification['palm_type'] = '직선형/실무형'
    
    return classification
