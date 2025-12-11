import { useState } from "react";
import "./App.css";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000") || "http://localhost:8000";

function App() {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [generatedImage, setGeneratedImage] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [baseImagePreview, setBaseImagePreview] = useState("");
  const [baseImageFile, setBaseImageFile] = useState(null);
  const [editedImage, setEditedImage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const resetStatus = () => {
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    resetStatus();
    if (!generatePrompt.trim()) {
      setErrorMessage("Please enter a prompt to generate an image.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: generatePrompt,
          size,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to generate image.");
      }
      const imageUrl = `data:image/png;base64,${data.image}`;
      setGeneratedImage(imageUrl);
      setBaseImagePreview(imageUrl);
      setBaseImageFile(null);
      setStatusMessage("Image generated! You can now edit it on the right.");
    } catch (err) {
      const message =
        err?.message || "Something went wrong while generating the image.";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGeneratedForEdit = () => {
    if (generatedImage) {
      setBaseImagePreview(generatedImage);
      setBaseImageFile(null);
      setStatusMessage("Using generated image for editing.");
      setErrorMessage("");
    }
  };

  const handleFileChange = (event) => {
    resetStatus();
    const file = event.target.files?.[0];
    if (file) {
      setBaseImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setBaseImagePreview(previewUrl);
      setStatusMessage("Using uploaded image for editing.");
    }
  };

  const buildImageFile = async () => {
    if (baseImageFile) {
      return baseImageFile;
    }
    if (baseImagePreview) {
      const response = await fetch(baseImagePreview);
      const blob = await response.blob();
      return new File([blob], "image.png", {
        type: blob.type || "image/png",
      });
    }
    return null;
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    resetStatus();
    if (!editPrompt.trim()) {
      setErrorMessage("Please enter a prompt to edit the image.");
      return;
    }

    const fileForEdit = await buildImageFile();
    if (!fileForEdit) {
      setErrorMessage("Please generate or upload an image to edit.");
      return;
    }

    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append("prompt", editPrompt);
      formData.append("image", fileForEdit);

      const response = await fetch(`${API_BASE_URL}/api/edit`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to edit image.");
      }

      setEditedImage(`data:image/png;base64,${data.image}`);
      setStatusMessage("Image edited successfully.");
    } catch (err) {
      const message =
        err?.message || "Something went wrong while editing the image.";
      setErrorMessage(message);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">OpenAI gpt-image-1</p>
          <h1>Image generation & editing</h1>
          <p className="subtitle">
            Create an image from a prompt, then refine it with another prompt.
          </p>
        </div>
        {statusMessage && <p className="status success">{statusMessage}</p>}
        {errorMessage && <p className="status error">{errorMessage}</p>}
      </header>

      <main className="columns">
        <section className="panel">
          <div className="panel__header">
            <h2>Create image</h2>
            <span className="tag">Step 1</span>
          </div>
          <form className="form" onSubmit={handleGenerate}>
            <label className="label">
              Prompt
              <textarea
                value={generatePrompt}
                onChange={(event) => setGeneratePrompt(event.target.value)}
                placeholder="A watercolor painting of a lighthouse on a stormy coast"
                required
              />
            </label>
            <label className="label">
              Size
              <select value={size} onChange={(event) => setSize(event.target.value)}>
                <option value="1024x1024">1024 x 1024</option>
                <option value="1536x1024">1536 x 1024</option>
                <option value="1024x1536">1024 x 1536</option>
                <option value="auto">Auto</option>
              </select>
            </label>
            <button className="button" type="submit" disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate image"}
            </button>
          </form>
          {generatedImage && (
            <div className="image-card">
              <div className="image-card__header">
                <h3>Generated image</h3>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={handleUseGeneratedForEdit}
                >
                  Use for editing
                </button>
              </div>
              <img src={generatedImage} alt="Generated result" />
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Edit image</h2>
            <span className="tag">Step 2</span>
          </div>
          <form className="form" onSubmit={handleEdit}>
            <label className="label">
              Editing prompt
              <textarea
                value={editPrompt}
                onChange={(event) => setEditPrompt(event.target.value)}
                placeholder="Add stars in the night sky and a calm moonlit glow."
                required
              />
            </label>
            <label className="label">
              Upload base image (optional)
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <span className="hint">
                If omitted, the latest generated image will be used.
              </span>
            </label>
            <button className="button" type="submit" disabled={isEditing}>
              {isEditing ? "Editing..." : "Edit image"}
            </button>
          </form>

          {baseImagePreview && (
            <div className="image-card">
              <div className="image-card__header">
                <h3>Image to edit</h3>
              </div>
              <img src={baseImagePreview} alt="Base for editing" />
            </div>
          )}

          {editedImage && (
            <div className="image-card">
              <div className="image-card__header">
                <h3>Edited image</h3>
              </div>
              <img src={editedImage} alt="Edited result" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
