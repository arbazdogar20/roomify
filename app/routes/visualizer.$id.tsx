import Button from "components/ui/Button";
import { generate3Dview } from "lib/ai.action";
import { Box, Download, RefreshCcw, Share, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

const VisualizerId = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { initialImage, name, initialRender } = location.state || {};

  const hasInitialGenerated = useRef(false);

  const [processing, setProcessing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(
    initialImage || null,
  );

  const handleBack = () => navigate("/");

  const runGeneration = async () => {
    if (!initialImage) return;

    try {
      setProcessing(true);
      const result = await generate3Dview({ sourceImage: initialImage });

      if (result.renderedImage) {
        setCurrentImage(result.renderedImage);
      }
    } catch (error) {
      console.error("Error during generation:", error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!initialRender || hasInitialGenerated.current) return;

    if (initialRender) {
      setCurrentImage(initialRender);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    runGeneration();
  }, [initialRender, initialImage]);

  return (
    <div className="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box size={24} className="logo" />

          <span className="name">Roomify</span>
        </div>
        <Button className="exit" variant="ghost" size="sm" onClick={handleBack}>
          <X className="icon" size={18} /> Exit Editor
        </Button>
      </nav>

      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{`Untitled Project`}</h2>
              <p className="note">Created By You</p>
            </div>

            <div className="panel-actions">
              <Button
                size="sm"
                className="export"
                onClick={runGeneration}
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2" size={16} /> Export
              </Button>
              <Button
                size="sm"
                className="share"
                onClick={runGeneration}
                disabled={!currentImage}
              >
                <Share2 className="w-4 h-4 mr-2" size={16} /> Share
              </Button>
            </div>
          </div>

          <div className={`render-area ${processing ? "is-processing" : ""}`}>
            {currentImage ? (
              <img
                src={currentImage}
                alt="AI Generated Render"
                className="renderimg"
              />
            ) : (
              <div className="render-placeholder">
                {initialImage && (
                  <img
                    className="render-fallback"
                    src={initialImage}
                    alt="Original Floor Plan"
                  />
                )}
              </div>
            )}

            {processing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <RefreshCcw className="spinner" />
                  <span className="title">Rendering...</span>
                  <span className="subtitle">
                    Please wait while we generate your 3D view
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VisualizerId;
