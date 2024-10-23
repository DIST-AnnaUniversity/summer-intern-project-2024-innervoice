import React, { useState, useEffect, useRef } from "react";
import { io } from 'socket.io-client';
import Webcam from 'react-webcam';

const VideoStreamer = () => {
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [action, setAction] = useState(""); // State to track the action

    const user = "YourUserName"; // Replace with the desired username
    const socketRef = useRef(null);
    const webcamRef = useRef(null);
    const streamingRef = useRef(false); // Ref to hold streaming state

    useEffect(() => {
        // Open socket connection with WebSocket transport
        socketRef.current = io('https://11c5-14-139-161-250.ngrok-free.app');
        socketRef.current.on("connect", () => {
            console.log("Connected to Socket.IO server");
        });

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            setSelectedVoice(availableVoices[0]); // Set default to the first voice
        };

        socketRef.current.on("chat", (chat) => {
            setMessages(prevMessages => [...prevMessages, chat]);
        });

        const initialMessage = 'This is your inner voice! Tap on the left bottom of the screen to enter Find mode, Tap on the right bottom of the screen to enter SafeStreet mode.';
        speakMessage(initialMessage);

        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const updateChatInput = (e) => {
        setChatInput(e.target.value);
    };

    const sendChat = (e) => {
        e.preventDefault();
        socketRef.current.emit("chat", { user: user, msg: chatInput });
        setChatInput("");
    };

    // Function to start and stop streaming
    const toggleStreaming = (selectedAction) => {
        if (isStreaming) {
            setIsStreaming(false); // Stop streaming
            streamingRef.current = false; // Update the ref
        } else {
            setIsStreaming(true); // Start streaming
            streamingRef.current = true; // Update the ref
            setAction(selectedAction); // Set the action based on the button clicked
            streamVideo(selectedAction); // Call the streaming function with the action
        }
    };

    const streamVideo = (selectedAction) => {
        if (!webcamRef.current) return;

        const intervalId = setInterval(() => {
            if (!streamingRef.current) {
                clearInterval(intervalId); // Stop if not streaming
                return;
            }

            // Capture frame from the webcam
            const imageSrc = webcamRef.current.getScreenshot();

            if (imageSrc) {
                console.log("Sending frame to server"); // Log when sending frame
                // Emit image and action to the backend through socket
                socketRef.current.emit("stream", { image: imageSrc, action: selectedAction });
            }
        }, 100); // Send a frame every 100 milliseconds (adjust as needed)
    };

    const speakMessage = (message) => {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
    };

    return (
        <div className="flex flex-col content-center items-center gap-5">
            <div>
                {messages.map((message, ind) => (
                    <div key={ind}>{`${message.user}: ${message.msg}`}</div>
                ))}
            </div>
            <form onSubmit={sendChat} onClick={() => speakMessage("Type the object to Find")}>
                <input
                    value={chatInput}
                    onChange={updateChatInput}
                    placeholder="Type your message here..."
                    className="p-2 rounded-lg mr-10"
                />
                <button type="submit" className=" text-white">Send</button>
            </form>

            {/* Camera Frame */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', marginTop: '20px' }}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }} // Use front camera
                    style={{ width: '100%', height: 'auto', border: '2px solid #fff' }}
                />
                {(!isStreaming) && (
                    <div className="overlay" /> // Overlay when not streaming
                )}
                {isStreaming ? (
                    <button onClick={() => { stopSpeaking(); toggleStreaming(); speakMessage("Recording Stopped"); }} className="mt-5 ml-44 mr-10 border-white text-white">Stop</button> // Single stop button
                ) : (
                    <>
                        <button onClick={() => { stopSpeaking(); toggleStreaming("Find"); speakMessage("Find Tab.. Started recording.. Press Stop, to end recording"); }} className="mt-10 ml-20 mr-10 border-white text-white">Find</button>
                        <button onClick={() => { stopSpeaking(); toggleStreaming("SafeStreet"); speakMessage('SafeStreet Tab.. Started recording.. Press Stop, to end recording '); }} className="mt-10 ml-10 mr-10 border-white text-white">SafeStreet</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoStreamer;
