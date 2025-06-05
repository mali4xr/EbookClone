import React from 'react';

interface PageCounterProps {
  current: number;
  total: number;
}

const PageCounter = ({ current, total }: PageCounterProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Page</span>
      <div className="px-3 py-1 rounded-md bg-gray-100 text-sm font-medium">
        {current} / {total}
      </div>
    </div>
  );
};

export default PageCounter;