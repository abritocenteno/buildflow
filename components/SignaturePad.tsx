"use client";

import { useRef, useState } from "react";

interface Props {
    onChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ onChange }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const getPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ("touches" in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        isDrawing.current = true;
        const ctx = canvasRef.current!.getContext("2d")!;
        const { x, y } = getPoint(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing.current) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#18181b";
        const { x, y } = getPoint(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (isEmpty) setIsEmpty(false);
    };

    const endDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing.current) return;
        isDrawing.current = false;
        if (!isEmpty) onChange(canvasRef.current!.toDataURL("image/png"));
    };

    const clear = () => {
        const canvas = canvasRef.current!;
        canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onChange(null);
    };

    return (
        <div>
            <div className="relative border-2 border-dashed border-zinc-300 rounded-2xl overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={700}
                    height={220}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                />
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <p className="text-sm text-zinc-400">Sign here with your finger or stylus</p>
                    </div>
                )}
            </div>
            {!isEmpty && (
                <button type="button" onClick={clear} className="mt-2 text-sm text-zinc-400 hover:text-zinc-600 underline">
                    Clear signature
                </button>
            )}
        </div>
    );
}
