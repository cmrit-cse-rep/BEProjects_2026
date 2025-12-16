import React, { useState, useRef } from 'react';
import { api } from './api.js';

export default function PDFUpload({ user, onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (["dragenter", "dragover"].includes(e.type)) setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = async (file) => {
    if (file.type !== 'application/pdf') return setError('Please upload a PDF file only.');
    if (file.size > 10 * 1024 * 1024) return setError('File size must be less than 10MB.');

    setError(null);
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      if (user?._id) {
      formData.append('userId', user._id);
    }
      formData.append('pdf', file);


      console.log("Uploading with userId:", user?._id); // debug

      const response = await api.uploadPDF(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      setExtractedData(response);
      onUploadComplete?.(response);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || 'Failed to process PDF. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pdf-upload-section">
      <div className="section-header">
        <h2>📄 Bank Statement Upload</h2>
        <p className="text-secondary">Upload your bank statement PDF to extract and categorize transactions</p>
      </div>

      {!uploadedFile ? (
        <div
          className={`pdf-upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <h3>Drop your bank statement PDF here</h3>
            <p>or</p>
            <button
              className="btn btn--primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <p className="upload-hint">Supports PDF files up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className="upload-results">
          {isUploading ? (
            <div className="upload-progress">
              <h3>Processing your bank statement...</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p>{uploadProgress}% complete</p>
            </div>
          ) : extractedData ? (
            <div className="extraction-results">
              <div className="results-header">
                <h3>✅ Statement Processed Successfully!</h3>
                <button className="btn btn--outline" onClick={resetUpload}>Upload Another</button>
              </div>

              <div className="extraction-stats">
                <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-content"><h4>Transactions Found</h4><p>{extractedData.transactions?.length || 0}</p></div></div>
                <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-content"><h4>Total Amount</h4><p>₹{extractedData.totalAmount?.toLocaleString() || 0}</p></div></div>
                <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-content"><h4>Date Range</h4><p>{extractedData.dateRange?.start ? `${new Date(extractedData.dateRange.start).toLocaleDateString()} - ${new Date(extractedData.dateRange.end).toLocaleDateString()}` : 'N/A'}</p></div></div>
              </div>

              {extractedData.insights?.length > 0 && (
                <div className="statement-insights">
                  <h4>💡 Key Insights</h4>
                  <div className="insights-list">
                    {extractedData.insights.map((i, idx) => (
                      <div key={idx} className="insight-item">
                        <span className="insight-icon">{i.icon}</span>
                        <span className="insight-text">{i.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {extractedData.transactions?.length > 0 && (
                <div className="extracted-transactions">
                  <h4>📋 Extracted Transactions</h4>
                  <div className="transactions-preview">
                    {extractedData.transactions.slice(0, 5).map((tx, idx) => (
                      <div key={idx} className="transaction-preview">
                        <div className="tx-info">
                          <span className="tx-description">{tx.description}</span>
                          <span className="tx-category">{tx.category}</span>
                        </div>
                        <span className="tx-amount">₹{tx.amount}</span>
                      </div>
                    ))}
                    {extractedData.transactions.length > 5 && (
                      <p className="more-transactions">... and {extractedData.transactions.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="btn btn--outline" onClick={resetUpload}>Try Again</button>
        </div>
      )}
    </div>
  );
}
