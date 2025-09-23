
import React from 'react';

interface ImageComparisonProps {
    originalUrl: string;
    reconstructedUrl: string;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({ originalUrl, reconstructedUrl }) => {
    return (
        <div className="mt-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">Forensic Reconstruction Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-center text-gray-300 mb-3">Uploaded Document</h3>
                    <div className="aspect-w-1 aspect-h-1 bg-black rounded-lg overflow-hidden">
                        <img src={originalUrl} alt="Original document upload" className="object-contain h-full w-full" />
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-purple-500/50">
                    <h3 className="text-lg font-semibold text-center text-gray-300 mb-3">AI Reconstructed View</h3>
                     <div className="aspect-w-1 aspect-h-1 bg-black rounded-lg overflow-hidden">
                        <img src={reconstructedUrl} alt="AI reconstructed document" className="object-contain h-full w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};
