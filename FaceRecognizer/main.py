import numpy as np
import face_recognition
import os
from PIL import Image
import sys

email = sys.argv[1]
PATH = sys.argv[2]

storedImagePath = PATH + email + ".JPG"
checkImagePath = PATH + "recognizeImages\\" + email + ".JPG"

storedImage = face_recognition.load_image_file(storedImagePath)
checkImage = face_recognition.load_image_file(checkImagePath)

storedImageEncodings = []
checkImageEncodings = []

storedImageEncodings = face_recognition.face_encodings(storedImage)
checkImageEncodings = face_recognition.face_encodings(checkImage)

faceFound = False

for checkImageEncoding in checkImageEncodings:
    result = face_recognition.compare_faces(storedImageEncodings, checkImageEncoding)
    if(result[0] == True): #result is a list containing True or False
        faceFound = True
        break

if faceFound:
    print("TRUE", end="")
else:
    print("FALSE", end="")

