import cv2
import numpy as np


class AttackSimulator:
    @staticmethod
    def jpeg_compression(img, quality=85):
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)]
        ok, enc = cv2.imencode(".jpg", img, encode_param)
        if not ok:
            return img
        dec = cv2.imdecode(enc, cv2.IMREAD_COLOR)
        return dec

    @staticmethod
    def crop(img, crop_percent=0.1):
        h, w = img.shape[:2]
        dx = int(w * crop_percent)
        dy = int(h * crop_percent)
        left = dx
        top = dy
        right = w - dx
        bottom = h - dy
        if right <= left or bottom <= top:
            return img
        cropped = img[top:bottom, left:right]
        resized = cv2.resize(cropped, (w, h), interpolation=cv2.INTER_AREA)
        return resized

    @staticmethod
    def resize(img, scale=0.9):
        h, w = img.shape[:2]
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return cv2.resize(resized, (w, h), interpolation=cv2.INTER_AREA)

    @staticmethod
    def rotate(img, angle=5):
        h, w = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)
        return rotated

    @staticmethod
    def blur(img, kernel_size=3):
        k = int(kernel_size) | 1
        return cv2.GaussianBlur(img, (k, k), 0)

    @staticmethod
    def noise(img, noise_level=5.0):
        noise = np.random.normal(0, noise_level, img.shape).astype(np.float32)
        noisy = img.astype(np.float32) + noise
        return np.clip(noisy, 0, 255).astype(np.uint8)

    @staticmethod
    def brightness_contrast(img, alpha=1.0, beta=0.0):
        out = cv2.convertScaleAbs(img, alpha=float(alpha), beta=float(beta))
        return out

    @staticmethod
    def gamma(img, gamma=1.0):
        inv_gamma = 1.0 / float(gamma)
        table = np.array([
            ((i / 255.0) ** inv_gamma) * 255
            for i in range(256)
        ]).astype("uint8")
        return cv2.LUT(img, table)

    @staticmethod
    def text_overlay(img, text="DEMO", alpha=0.8):
        overlay = img.copy()
        h, w = img.shape[:2]
        cv2.putText(
            overlay,
            text,
            (int(0.05 * w), int(0.1 * h)),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )
        return cv2.addWeighted(overlay, float(alpha), img, 1 - float(alpha), 0)

    @staticmethod
    def sticker_overlay(img, size_frac=0.2, alpha=1.0):
        h, w = img.shape[:2]
        sw, sh = int(w * size_frac), int(h * size_frac)
        overlay = img.copy()
        x0, y0 = w - sw - 5, h - sh - 5
        cv2.rectangle(overlay, (x0, y0), (x0 + sw, y0 + sh), (0, 0, 0), thickness=-1)
        return cv2.addWeighted(overlay, float(alpha), img, 1 - float(alpha), 0)

    @staticmethod
    def pipeline_whatsapp(img, max_side=1280, quality=80):
        h, w = img.shape[:2]
        scale = min(1.0, max_side / max(h, w))
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)]
        ok, enc = cv2.imencode(".jpg", resized, encode_param)
        if not ok:
            return img
        dec = cv2.imdecode(enc, cv2.IMREAD_COLOR)
        return cv2.resize(dec, (w, h), interpolation=cv2.INTER_AREA)

    @staticmethod
    def pipeline_instagram(img, max_side=1080, quality=85):
        h, w = img.shape[:2]
        scale = min(1.0, max_side / max(h, w))
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)]
        ok, enc = cv2.imencode(".jpg", resized, encode_param)
        if not ok:
            return img
        dec = cv2.imdecode(enc, cv2.IMREAD_COLOR)
        return cv2.resize(dec, (w, h), interpolation=cv2.INTER_AREA)

    @staticmethod
    def pipeline_twitter(img, max_side=1600, quality=85):
        h, w = img.shape[:2]
        scale = min(1.0, max_side / max(h, w))
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)]
        ok, enc = cv2.imencode(".jpg", resized, encode_param)
        if not ok:
            return img
        dec = cv2.imdecode(enc, cv2.IMREAD_COLOR)
        return cv2.resize(dec, (w, h), interpolation=cv2.INTER_AREA)

    @staticmethod
    def pipeline_tiktok(img, max_side=1080, quality=80):
        h, w = img.shape[:2]
        scale = min(1.0, max_side / max(h, w))
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)]
        ok, enc = cv2.imencode(".jpg", resized, encode_param)
        if not ok:
            return img
        dec = cv2.imdecode(enc, cv2.IMREAD_COLOR)
        return cv2.resize(dec, (w, h), interpolation=cv2.INTER_AREA)
