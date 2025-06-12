import React, { useState } from 'react';
import { Plus, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { useBook } from '../context/BookContext';

interface PageManagerProps {
  onClose: () => void;
}

const PageManager = ({ onClose }: PageManagerProps) => {
  const { 
    totalPages, 
    currentPage,
    addNewPage,
    deletePage,
    refreshStoryData,
    isLoading 
  } = useBook();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePageNumber, setDeletePageNumber] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPage = async () => {
    setIsAdding(true);
    try {
      await addNewPage();
      await refreshStoryData();
    } catch (error) {
      console.error('Failed to add page:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePage = async (pageNumber: number) => {
    setIsDeleting(true);
    try {
      await deletePage(pageNumber);
      await refreshStoryData();
      setDeletePageNumber(null);
    } catch (error) {
      console.error('Failed to delete page:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate__animated animate__slideInDown">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Manage Pages</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Story Status</h3>
            <p className="text-blue-700 text-sm">
              Total Pages: {totalPages}
            </p>
            <p className="text-blue-700 text-sm">
              Current Page: {currentPage + 1}
            </p>
          </div>

          {/* Add New Page */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800">Add New Page</h3>
            <button
              onClick={handleAddPage}
              disabled={isAdding || isLoading}
              className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Add New Page
                </>
              )}
            </button>
            <p className="text-xs text-gray-500">
              This will add a new blank page at the end of the story
            </p>
          </div>

          {/* Delete Page */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800">Delete Page</h3>
            
            {totalPages <= 1 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <p className="text-yellow-700 text-sm">
                    Cannot delete the last remaining page
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => setDeletePageNumber(index + 1)}
                      className={`p-2 text-sm rounded border transition-all duration-300 ${
                        deletePageNumber === index + 1
                          ? 'bg-red-100 border-red-300 text-red-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Page {index + 1}
                    </button>
                  ))}
                </div>

                {deletePageNumber && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <p className="text-red-700 text-sm font-medium">
                        Delete Page {deletePageNumber}?
                      </p>
                    </div>
                    <p className="text-red-600 text-xs mb-3">
                      This action cannot be undone. All content will be permanently lost.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeletePage(deletePageNumber)}
                        disabled={isDeleting}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            Delete
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setDeletePageNumber(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageManager;