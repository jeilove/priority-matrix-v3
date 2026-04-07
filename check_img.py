import cv2
import numpy as np

input_path = r"e:\바이브코딩\할일관리_아이젠하위\아이콘\해봐줘요 아이콘.png"
data = np.fromfile(input_path, np.uint8)
img = cv2.imdecode(data, cv2.IMREAD_UNCHANGED)
gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY) if img.shape[2] == 4 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
print(f"Gray range: {np.min(gray)} to {np.max(gray)}")
# Count frequency of gray levels to find background
unique, counts = np.unique(gray, return_counts=True)
top_5 = sorted(zip(unique, counts), key=lambda x: x[1], reverse=True)[:5]
print(f"Top 5 gray levels: {top_5}")
