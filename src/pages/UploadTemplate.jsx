import React, { useState } from "react";
import axios from "axios";
import "./uploadTemplate.css";

export default function UploadTemplate() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("template", file);

    try {
      const response = await axios.post("http://localhost:5000/upload-template", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(response.data.message || "Template uploaded successfully!");
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Error uploading template. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-template-page">
      <h2>Upload Your Template</h2>
      <div className="upload-card">
        <input type="file" accept=".ppt,.pptx" onChange={handleFileChange} />
        {preview && (
          <div className="preview">
            <p>Preview:</p>
            <iframe
              src={preview}
              title="Template Preview"
              width="100%"
              height="200px"
            />
          </div>
        )}

        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Template"}
        </button>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
