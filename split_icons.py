import cv2
import numpy as np
import os

def split_icons_v7(input_path, output_dir, count=20):
    try:
        data = np.fromfile(input_path, np.uint8)
        img = cv2.imdecode(data, cv2.IMREAD_UNCHANGED)
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    if img is None: return
    
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

    gray = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2GRAY)
    
    # 배경(240내외)보다 낮은 값들을 아이콘으로 인식
    _, mask = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY_INV)
    
    # 근접한 윤곽선들끼리 결합 (특히 글씨 포함을 위해)
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_DILATE, kernel, iterations=2)
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    img_area = img.shape[0] * img.shape[1]
    rects = []
    for c in contours:
        area = cv2.contourArea(c)
        if 2000 < area < img_area * 0.95:
            x, y, w, h = cv2.boundingRect(c)
            rects.append([x, y, w, h])
    
    # 같은 X축 영역에 있는 것들(아이콘과 그 아래 글씨)을 세로로 병합
    def group_vertically(rects):
        if not rects: return []
        # X축 순서로 정렬된 복사본
        sorted_x = sorted(rects, key=lambda r: r[0])
        res = []
        while sorted_x:
            curr = sorted_x.pop(0)
            cx, cy, cw, ch = curr
            
            # 현재 사각형과 X축이 일정 부분 겹치는 것들 중 가장 가까운 아래 영역 찾기
            # 사실상 X축 겹치는 건 다 묶어버림 (가까울 경우)
            to_group = [curr]
            remained = []
            for r in sorted_x:
                rx, ry, rw, rh = r
                overlap = max(0, min(cx+cw, rx+rw) - max(cx, rx))
                if overlap > min(cw, rw) * 0.4 and abs(ry - (cy+ch)) < 300: # 300px 이내
                    to_group.append(r)
                else:
                    remained.append(r)
            
            # 병합된 최종 바운딩 박스
            mx1 = min([m[0] for m in to_group])
            my1 = min([m[1] for m in to_group])
            mx2 = max([m[0]+m[2] for m in to_group])
            my2 = max([m[1]+m[3] for m in to_group])
            
            res.append([mx1, my1, mx2-mx1, my2-my1])
            sorted_x = remained
        return res

    final_regions = group_vertically(rects)
    final_regions.sort(key=lambda x: x[2]*x[3], reverse=True)
    
    print(f"Final icon regions: {len(final_regions)}")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for i, r in enumerate(final_regions[:count]):
        x, y, w, h = r
        m = 40
        x1, y1 = max(0, x-m), max(0, y-m)
        x2, y2 = min(img.shape[1], x+w+m), min(img.shape[0], y+h+m)
        
        crop = img[y1:y2, x1:x2].copy()
        
        # 알파 채널 부드럽게 ( Gaussian Blur )
        c_gray = cv2.cvtColor(crop[:,:,:3], cv2.COLOR_BGR2GRAY)
        _, c_mask = cv2.threshold(c_gray, 243, 255, cv2.THRESH_BINARY_INV)
        c_mask = cv2.GaussianBlur(c_mask, (5, 5), 0)
        crop[:, :, 3] = c_mask

        out_name = os.path.join(output_dir, f"icon_final_{i+1}.png")
        _, buf = cv2.imencode(".png", crop, [cv2.IMWRITE_PNG_COMPRESSION, 0])
        buf.tofile(out_name)
        print(f"Saved: {out_name} ({w}x{h})")

if __name__ == "__main__":
    input_file = r"e:\바이브코딩\할일관리_아이젠하위\아이콘\해봐줘요 아이콘.png"
    output_folder = r"e:\바이브코딩\할일관리_아이젠하위\아이콘\split_v7"
    split_icons_v7(input_file, output_folder)
