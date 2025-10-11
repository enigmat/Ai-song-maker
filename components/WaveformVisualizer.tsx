import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  color: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioBuffer, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) {
        // Clear canvas if no buffer
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                 const parent = canvas.parentElement;
                if(parent) ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);
            }
        }
        return;
    };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Set canvas size based on parent, considering device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    
    // Use the left channel for visualization
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.beginPath();
    
    // Draw the waveform by sampling min/max values for each vertical pixel line
    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;

        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }

        ctx.moveTo(i + 0.5, (1 + min) * amp);
        ctx.lineTo(i + 0.5, (1 + max) * amp);
    }
    
    ctx.stroke();

  }, [audioBuffer, color]);

  return (
    <div className="w-full h-24 bg-gray-900/50 rounded-lg border border-gray-700">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
