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
    <div className="mt-4 flex flex-wrap justify-center gap-2 p-2 bg-white rounded-xl shadow-md border border-gray-200">
      {colors.map((color, index) => (
        <div
          key={index}
          className={`w-8 h-8 rounded-full border-2 cursor-pointer shadow-md transform hover:scale-110 transition-transform duration-150
            ${
              selectedColor === color
                ? "border-sky-500 border-4"
                : "border-gray-300"
            }`}
          style={{ backgroundColor: color }}
          onClick={(e) => onColorSelect(color, e)}
        ></div>
      ))}
    </div>
  );
};

export default ColorPalette;