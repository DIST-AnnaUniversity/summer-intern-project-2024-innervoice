from flask_socketio import SocketIO, emit
import os
import base64
import numpy as np  # Added import for NumPy
import cv2         # Added import for OpenCV

if os.environ.get('FLASK_ENV') == 'production':
    origins = [
        'https://c08b-14-139-161-250.ngrok-free.app'
    ]
else:
    origins = "*"

# Initialize the SocketIO instance
socketio = SocketIO(cors_allowed_origins=origins)

# Handle chat messages
@socketio.on("chat")
def handle_chat(data):
    # Capitalize the message
    capitalized_msg = data['msg'].upper()
    # Create a new data object with the capitalized message
    response_data = {
        'user': data['user'],
        'msg': capitalized_msg
    }
    print("capital", capitalized_msg)
    # Broadcast the capitalized message back to all clients
    emit("chat", response_data, broadcast=True)

@socketio.on("stream")
def handle_stream(data):
    print("Received a frame")  # Log when receiving a frame
    
    # Decode the base64 image
    image_data = data['image'].split(",")[1]
    image_bytes = base64.b64decode(image_data)
    
    # Convert to numpy array
    np_array = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    # Get the action type
    action = data.get('action')
    print(f"Action received: {action}")


    # Process the frame with OpenCV (e.g., display it, process it, etc.)
    cv2.imwrite("received_frame.jpg", frame)  # Save the frame to disk for verification

