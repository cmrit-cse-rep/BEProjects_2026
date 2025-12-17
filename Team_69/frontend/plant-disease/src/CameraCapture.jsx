import React, { useState, useRef, useEffect } from 'react';
import './CameraCapture.css';

const CameraCapture = ({ onCapture, onFileSelect }) => {
    const [mode, setMode] = useState('upload'); // 'upload' or 'camera'
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'user' (front) or 'environment' (back)
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Start camera with specified facing mode
    const startCamera = async (facing = facingMode) => {
        try {
            setError(null);

            // Stop existing stream if any
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setStream(mediaStream);
            setFacingMode(facing);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please check permissions or use file upload.');
            setMode('upload'); // Fallback to upload mode
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // Flip camera between front and back
    const flipCamera = () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        startCamera(newFacingMode);
    };

    // Capture photo from video stream
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                    const imageUrl = URL.createObjectURL(blob);
                    setCapturedImage(imageUrl);

                    // Call the onCapture callback with the file
                    if (onCapture) {
                        onCapture(file);
                    }

                    // Stop camera after capture
                    stopCamera();
                }
            }, 'image/jpeg', 0.95);
        }
    };

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    // Handle file upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && onFileSelect) {
            onFileSelect(file);
        }
    };

    // Trigger file input click
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Switch mode
    const switchMode = (newMode) => {
        setMode(newMode);
        setCapturedImage(null);
        setError(null);

        if (newMode === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className="camera-capture-container">
            {/* Mode Toggle */}
            <div className="mode-toggle">
                <button
                    className={`mode-button ${mode === 'upload' ? 'active' : ''}`}
                    onClick={() => switchMode('upload')}
                >
                    📁 Upload
                </button>
                <button
                    className={`mode-button ${mode === 'camera' ? 'active' : ''}`}
                    onClick={() => switchMode('camera')}
                >
                    📷 Camera
                </button>
            </div>

            {/* Upload Mode */}
            {mode === 'upload' && (
                <div className="upload-section">
                    <div className="upload-label" onClick={triggerFileInput}>
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span>Tap to Upload Image</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-input"
                        />
                    </div>
                    <p className="upload-hint">
                        💡 Use a clear photo of the plant leaf
                    </p>
                </div>
            )}

            {/* Camera Mode */}
            {mode === 'camera' && (
                <div className="camera-section">
                    {error && (
                        <div className="camera-error">
                            <p>{error}</p>
                        </div>
                    )}

                    {!capturedImage && !error && (
                        <div className="camera-preview-wrapper">
                            <p className="camera-hint">
                                📸 Position leaf in frame
                            </p>

                            <div className="camera-preview">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="video-preview"
                                />

                                {/* Camera Flip Button */}
                                <button className="flip-camera-button" onClick={flipCamera} title="Flip Camera">
                                    🔄
                                </button>

                                {/* Capture Button */}
                                <button className="capture-button" onClick={capturePhoto}>
                                    <span className="capture-icon">📸</span>
                                    Capture
                                </button>
                            </div>

                            <p className="camera-info">
                                {facingMode === 'environment' ? '📱 Back' : '🤳 Front'} Camera
                            </p>
                        </div>
                    )}

                    {capturedImage && (
                        <div className="captured-preview">
                            <p className="capture-success">✅ Photo captured!</p>

                            <img src={capturedImage} alt="Captured" className="captured-image" />

                            <div className="capture-actions">
                                <button className="retake-button" onClick={retakePhoto}>
                                    🔄 Retake
                                </button>
                            </div>

                            <p className="next-step-hint">
                                ✨ Analyzing...
                            </p>
                        </div>
                    )}

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
