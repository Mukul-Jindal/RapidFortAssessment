import React, { useState } from "react";
import { FaFileWord } from "react-icons/fa6";
import axios from "axios";
import { css } from "@emotion/react";
import { RingLoader } from "react-spinners";
import mammoth from 'mammoth';

function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [convert, setConvert] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const [metadata, setMetadata] = useState(null);

  const extractMetadata = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;

      // Use Mammoth to extract document content and metadata
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const metadata = {
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          wordCount: result.value.split(' ').length,  // Simple word count
        };
        setMetadata(metadata);
      } catch (error) {
        console.error("Error extracting metadata:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    extractMetadata(e.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setConvert("Please select a file");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    setConverting(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/convertFile",
        formData,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf"
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSelectedFile(null);
      setDownloadError("");
      setConvert("File Converted Successfully");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setDownloadError("Error occurred: " + error.response.data.message);
      } else {
        setConvert("");
      }
    } finally {
      setConverting(false);
    }
  };

  const override = css`
    display: block;
    margin: 0 auto;
    border-color: red;
  `;

  return (
    <>
      <div className="max-w-screen-2xl mx-auto container px-6 py-3 md:px-40">
        <div className="flex h-screen items-center justify-center">
          <div className="border-2 border-dashed px-4 py-2 md:px-8 md:py-6 border-indigo-400 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-center mb-4">
              Convert Word to PDF Online
            </h1>
            <p className="text-sm text-center mb-5">
              Easily convert Word documents to PDF format online, without having
              to install any software.
            </p>

            <div className="flex flex-col items-center space-y-4">
              <input
                type="file"
                accept=".doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="FileInput"
              />
              <label
                htmlFor="FileInput"
                className="w-full flex items-center justify-center px-4 py-6 bg-gray-100 text-gray-700 rounded-lg shadow-lg cursor-pointer border-blue-300 hover:bg-blue-200 duration-300 hover:text-blue-900"
              >
                <FaFileWord className="text-3xl mr-3" />
                <span className="text-2xl mr-2 ">
                  {selectedFile ? selectedFile.name : "Choose File"}
                </span>
              </label>
              {metadata && (
                <div>
                  <h1>File Metadata</h1>
                  <p><strong>File Name:</strong> {metadata.name}</p>
                  <p><strong>File Size:</strong> {(metadata.size / 1024).toFixed(2)} KB</p>
                  <p><strong>Last Modified:</strong> {new Date(metadata.lastModified).toLocaleString()}</p>
                  <p><strong>Word Count:</strong> {metadata.wordCount}</p>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || converting}
                className={`text-white bg-blue-500 hover:bg-blue-600 ${converting
                  ? "bg-gray-300 cursor-not-allowed"
                  : "hover:bg-blue-700"
                  } disabled:bg-gray-400 disabled:pointer-events-none duration-300 font-bold px-4 py-2 rounded-lg`}
              >
                {converting ? "Converting..." : "Convert File"}
              </button>
              {convert && (
                <div className="text-green-500 text-center">{convert}</div>
              )}
              {downloadError && (
                <div className="text-red-500 text-center">{downloadError}</div>
              )}
            </div>
          </div>
          {converting && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
              <RingLoader
                color="#4A90E2"
                loading={converting}
                css={override}
                size={150}
              />
            </div>
          )}
        </div>
      </div>

    </>
  );
}

export default Home;
