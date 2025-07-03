import React from 'react';

interface ColorPaletteProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string, e: React.MouseEvent) => void;
  hasGeneratedContent: boolean;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  hasGeneratedContent
}) => {
  if (!hasGeneratedContent) return null;

  return (
    <div className="mt-6 bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
      <h4 className="text-sm font-bold text-gray-700 mb-3 text-center">Color Palette</h4>
      <div className="flex flex-wrap justify-center gap-3">
        {colors.map((color, index) => (
          <button
            key={index}
            className={`w-10 h-10 rounded-full border-4 shadow-lg transform hover:scale-110 transition-all duration-200 ${
              selectedColor === color
                ? "border-gray-800 scale-110"
                : "border-white hover:border-gray-300"
            }`}
            style={{ backgroundColor: color }}
            onClick={(e) => onColorSelect(color, e)}
            title={`Color: ${color}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;