from PIL import Image
import os

img = Image.open(r'c:\Users\dbcdk\Desktop\사주사이트창재\손톱.jpg')
w, h = img.size
h_step = h // 4

out_dir = r'c:\Users\dbcdk\Desktop\사주사이트창재\public\images\palmistry'
os.makedirs(out_dir, exist_ok=True)

names = ['round-nails-real.jpg', 'pointed-nails-real.jpg', 'square-nails-real.jpg', 'rectangular-nails-real.jpg']

for i in range(4):
    box = (0, i * h_step, w, (i + 1) * h_step if i < 3 else h)
    cropped = img.crop(box)
    cropped.save(os.path.join(out_dir, names[i]))

print("Done cropping")
