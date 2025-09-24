import React, { useRef, useEffect } from 'react';

interface MusicVisualizerProps {
  analyser: any; // This will be a Tone.Analyser instance
  isPlaying: boolean;
}

export const MusicVisualizer: React.FC<MusicVisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const setCanvasDimensions = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;
      
      canvasCtx.clearRect(0, 0, width, height);
      
      const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#a855f7'); // purple-500
      gradient.addColorStop(0.5, '#ec4899'); // pink-500
      gradient.addColorStop(1, '#ef4444'); // red-500
      
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = gradient;
      canvasCtx.lineCap = 'round';
      
      canvasCtx.beginPath();
      
      if (!isPlaying) {
         // Gentle pulse when paused
         const time = Date.now() * 0.005;
         const amplitude = (Math.sin(time) * 0.5 + 0.5) * 4 + 1; // Pulse between 1 and 5 pixels
         canvasCtx.moveTo(0, height / 2);
         for(let x = 0; x < width; x++) {
             const y = height / 2 + Math.sin(x * 0.03 + time) * amplitude;
             canvasCtx.lineTo(x, y);
         }
      } else {
        const values = analyser.getValue();
        if (!(values instanceof Float32Array)) return;

        const sliceWidth = width * 1.0 / values.length;
        let x = 0;
        for (let i = 0; i < values.length; i++) {
            const v = values[i]; // value is from -1 to 1
            const y = (v * height / 2) + (height / 2);

            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
      }
      
      canvasCtx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId.current!);
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [analyser, isPlaying]);

  return (
    <div className="mt-8 h-28 w-full bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700/50 backdrop-blur-sm animate-fade-in">
        <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
    </div>
  );
};
