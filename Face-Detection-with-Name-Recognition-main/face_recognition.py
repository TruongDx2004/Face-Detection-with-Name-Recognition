import cv2
import numpy as np
import os

recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.read("trainer/trainer.yml") # Load the trained model
cascadePath = "haarcascade_frontalface_default.xml"
faceCascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

font = cv2.FONT_HERSHEY_SIMPLEX

#iniciate id counter
id = 0

# names related to ids: example ==> Marcelo: id=1, etc
names = ['None', 'Duong', 'Lan'] # Make sure these match your trained IDs

# Initialize and start realtime video capture
video_path = "input_video3.mp4"
cam = cv2.VideoCapture(video_path)
cam.set(3, 640) # set video widht
cam.set(4, 480) # set video height

# Define min window size to be recognized as a face
minW = 0.1 * cam.get(3)
minH = 0.1 * cam.get(4)

# --- Video Saving Setup ---
# Get original video properties for the output video
frame_width = int(cam.get(3))
frame_height = int(cam.get(4))
fps = int(cam.get(cv2.CAP_PROP_FPS))
if fps == 0: # Fallback if FPS cannot be retrieved (e.g., from an image sequence or some video formats)
    fps = 25 # Default to 25 FPS

# Define the codec and create VideoWriter object
# XVID is a commonly used codec that works well
fourcc = cv2.VideoWriter_fourcc(*'XVID')
output_filename = 'output_video_processed.avi'
out = cv2.VideoWriter(output_filename, fourcc, fps, (frame_width, frame_height))
# --- End Video Saving Setup ---

while True:
    ret, img = cam.read()
    if not ret: # Break the loop if no more frames are available
        break

    # img = cv2.flip(img, -1) # Flip vertically - Uncomment if needed

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    faces = faceCascade.detectMultiScale(
        gray,
        scaleFactor = 1.2,
        minNeighbors = 5,
        minSize = (int(minW), int(minH)),
    )

    for(x,y,w,h) in faces:
        cv2.rectangle(img, (x,y), (x+w,y+h), (0,255,0), 2)

        id, confidence = recognizer.predict(gray[y:y+h,x:x+w])

        # Check if confidence is less than 100 ==> "0" is perfect match
        if confidence < 100:
            if id >= 0 and id < len(names):
                name = names[id]
            else:
                name = "unknown" # Fallback for unknown IDs
            confidence_text = "  {0}%".format(round(100 - confidence))
        else:
            name = "unknown"
            confidence_text = "  {0}%".format(round(100 - confidence))

        # IMPORTANT: The following two lines seem to be hardcoding names based on ID.
        # This will override the `names` list lookup.
        # If you want to use the `names` list, you should remove or comment out these lines.
        # If you intend to have specific overrides, keep them.
        name = id

        cv2.putText(img, str(name), (x+5,y-5), font, 1, (255,255,255), 2)
        cv2.putText(img, str(confidence), (x+5,y+h-5), font, 1, (255,255,0), 1)

    cv2.imshow('camera', img)

    # --- Write the processed frame to the output video file ---
    out.write(img)
    # --- End Write ---

    k = cv2.waitKey(10) & 0xff # Press 'ESC' for exiting video
    if k == 27:
        break

# Do a bit of cleanup
print("\n [INFO] Exiting Program and cleanup stuff")
cam.release()
out.release() # Release the VideoWriter object
cv2.destroyAllWindows()