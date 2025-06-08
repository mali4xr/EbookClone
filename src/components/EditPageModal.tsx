import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EditPageModalProps {
  onClose: () => void;
  pageContent: {
    text: string;
    image: string;
    video: string;
    background: string;
    quiz?: {
      multipleChoice: {
        question: string;
        options: { text: string; isCorrect: boolean; }[];
      };
      spelling: {
        word: string;
        hint: string;
      };
      dragDrop?: {
        dragItems: { id: string; image: string; label: string }[];
        dropZones: { id: string; image: string; label: string; acceptsId: string }[];
        instructions?: string;
      };
    };
  };
  onSave: (content: {
    text: string;
    image: string;
    video: string;
    background: string;
    quiz?: {
      multipleChoice: {
        question: string;
        options: { text: string; isCorrect: boolean; }[];
      };
      spelling: {
        word: string;
        hint: string;
      };
      dragDrop?: {
        dragItems: { id: string; image: string; label: string }[];
        dropZones: { id: string; image: string; label: string; acceptsId: string }[];
        instructions?: string;
      };
    };
  }) => void;
}

const EditPageModal = ({ onClose, pageContent, onSave }: EditPageModalProps) => {
  const [content, setContent] = useState({
    ...pageContent,
    video: pageContent.video || pageContent.image, // Fallback to image if no video
    quiz: pageContent.quiz || {
      multipleChoice: {
        question: "What happened in this part of the story?",
        options: [
          { text: pageContent.text.substring(0, 50) + "...", isCorrect: true },
          { text: "Something else happened...", isCorrect: false },
          { text: "None of the above", isCorrect: false }
        ]
      },
      spelling: {
        word: pageContent.text.split(' ').find(word => word.length > 4) || "story",
        hint: "Try spelling this word from the story"
      },
      dragDrop: {
        dragItems: [
          { id: 'item1', image: 'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Character 1' },
          { id: 'item2', image: 'https://images.pexels.com/photos/416179/pexels-photo-416179.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Character 2' }
        ],
        dropZones: [
          { id: 'zone1', image: 'https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Location 1', acceptsId: 'item1' },
          { id: 'zone2', image: 'https://images.pexels.com/photos/531321/pexels-photo-531321.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Location 2', acceptsId: 'item2' }
        ],
        instructions: "Use arrow keys to move items around, then press Enter to drop them in the right place!"
      }
    }
  });

  const [showQuizEdit, setShowQuizEdit] = useState(false);
  const [showDragDropEdit, setShowDragDropEdit] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(content);
    onClose();
  };

  const updateMultipleChoiceOption = (index: number, text: string, isCorrect: boolean) => {
    setContent(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz!,
        multipleChoice: {
          ...prev.quiz!.multipleChoice,
          options: prev.quiz!.multipleChoice.options.map((opt, i) => 
            i === index ? { text, isCorrect } : { ...opt, isCorrect: isCorrect ? false : opt.isCorrect }
          )
        }
      }
    }));
  };

  const updateDragItem = (index: number, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz!,
        dragDrop: {
          ...prev.quiz!.dragDrop!,
          dragItems: prev.quiz!.dragDrop!.dragItems.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
          )
        }
      }
    }));
  };

  const updateDropZone = (index: number, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz!,
        dragDrop: {
          ...prev.quiz!.dragDrop!,
          dropZones: prev.quiz!.dragDrop!.dropZones.map((zone, i) => 
            i === index ? { ...zone, [field]: value } : zone
          )
        }
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate__animated animate__zoomIn">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 animate__animated animate__fadeInLeft">Edit Page Content</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 animate__animated animate__fadeInRight"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2 animate__animated animate__fadeInUp">
            <label className="block text-sm font-medium text-gray-700">
              Story Text
            </label>
            <textarea
              value={content.text}
              onChange={(e) => setContent({ ...content, text: e.target.value })}
              className="w-full h-32 p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-1s">
              <label className="block text-sm font-medium text-gray-700">
                Video URL
              </label>
              <input
                type="url"
                value={content.video}
                onChange={(e) => setContent({ ...content, video: e.target.value })}
                className="w-full p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="mt-2">
                <video
                  src={content.video}
                  className="max-h-32 rounded-md animate__animated animate__fadeIn"
                  controls
                  muted
                  onError={(e) => {
                    const target = e.target as HTMLVideoElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-1s">
              <label className="block text-sm font-medium text-gray-700">
                Fallback Image URL
              </label>
              <input
                type="url"
                value={content.image}
                onChange={(e) => setContent({ ...content, image: e.target.value })}
                className="w-full p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="mt-2">
                <img
                  src={content.image}
                  alt="Preview"
                  className="max-h-32 rounded-md animate__animated animate__fadeIn"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-2s">
            <label className="block text-sm font-medium text-gray-700">
              Background Image URL
            </label>
            <input
              type="url"
              value={content.background}
              onChange={(e) => setContent({ ...content, background: e.target.value })}
              className="w-full p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
              required
            />
            <div className="mt-2">
              <img
                src={content.background}
                alt="Background Preview"
                className="max-h-40 rounded-md animate__animated animate__fadeIn"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x300?text=Invalid+Background+URL';
                }}
              />
            </div>
          </div>

          <div className="space-y-4 animate__animated animate__fadeInUp animate__delay-3s">
            <button
              type="button"
              onClick={() => setShowQuizEdit(!showQuizEdit)}
              className="text-purple-600 hover:text-purple-700 font-medium transition-all duration-300 transform hover:scale-105"
            >
              {showQuizEdit ? 'Hide Quiz Editor' : 'Edit Quiz Questions'}
            </button>

            {showQuizEdit && (
              <div className="space-y-6 p-4 bg-gray-50 rounded-lg animate__animated animate__slideInDown">
                {/* Drag & Drop Instructions */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Drag & Drop Instructions</h3>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Instructions (Read Aloud)
                    </label>
                    <textarea
                      value={content.quiz?.dragDrop?.instructions || ''}
                      onChange={(e) => setContent(prev => ({
                        ...prev,
                        quiz: {
                          ...prev.quiz!,
                          dragDrop: {
                            ...prev.quiz!.dragDrop!,
                            instructions: e.target.value
                          }
                        }
                      }))}
                      className="w-full p-3 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                      placeholder="Use arrow keys to move items around, then press Enter to drop them in the right place!"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">This message will be read aloud when the drag & drop activity starts</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Multiple Choice Question</h3>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Question
                    </label>
                    <input
                      type="text"
                      value={content.quiz?.multipleChoice.question}
                      onChange={(e) => setContent(prev => ({
                        ...prev,
                        quiz: {
                          ...prev.quiz!,
                          multipleChoice: {
                            ...prev.quiz!.multipleChoice,
                            question: e.target.value
                          }
                        }
                      }))}
                      className="w-full p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Answer Options
                    </label>
                    {content.quiz?.multipleChoice.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3 animate__animated animate__fadeInLeft" style={{ animationDelay: `${index * 0.1}s` }}>
                        <input
                          type="radio"
                          checked={option.isCorrect}
                          onChange={() => updateMultipleChoiceOption(index, option.text, true)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateMultipleChoiceOption(index, e.target.value, option.isCorrect)}
                          className="flex-1 p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Spelling Question</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Word to Spell
                      </label>
                      <input
                        type="text"
                        value={content.quiz?.spelling.word}
                        onChange={(e) => setContent(prev => ({
                          ...prev,
                          quiz: {
                            ...prev.quiz!,
                            spelling: {
                              word: e.target.value,
                              hint: `This word has ${e.target.value.length} letters`
                            }
                          }
                        }))}
                        className="w-full p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Hint
                      </label>
                      <input
                        type="text"
                        value={content.quiz?.spelling.hint}
                        onChange={(e) => setContent(prev => ({
                          ...prev,
                          quiz: {
                            ...prev.quiz!,
                            spelling: {
                              ...prev.quiz!.spelling,
                              hint: e.target.value
                            }
                          }
                        }))}
                        className="w-full p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowDragDropEdit(!showDragDropEdit)}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    {showDragDropEdit ? 'Hide Drag & Drop Editor' : 'Edit Drag & Drop Activity'}
                  </button>

                  {showDragDropEdit && (
                    <div className="space-y-6 p-4 bg-blue-50 rounded-lg animate__animated animate__slideInDown">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Draggable Items</h4>
                        {content.quiz?.dragDrop?.dragItems.map((item, index) => (
                          <div key={index} className="grid grid-cols-3 gap-2 animate__animated animate__fadeInLeft" style={{ animationDelay: `${index * 0.1}s` }}>
                            <input
                              type="text"
                              placeholder="Item ID"
                              value={item.id}
                              onChange={(e) => updateDragItem(index, 'id', e.target.value)}
                              className="p-2 border rounded-md text-sm"
                            />
                            <input
                              type="url"
                              placeholder="Image URL"
                              value={item.image}
                              onChange={(e) => updateDragItem(index, 'image', e.target.value)}
                              className="p-2 border rounded-md text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Label"
                              value={item.label}
                              onChange={(e) => updateDragItem(index, 'label', e.target.value)}
                              className="p-2 border rounded-md text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Drop Zones</h4>
                        {content.quiz?.dragDrop?.dropZones.map((zone, index) => (
                          <div key={index} className="grid grid-cols-4 gap-2 animate__animated animate__fadeInRight" style={{ animationDelay: `${index * 0.1}s` }}>
                            <input
                              type="text"
                              placeholder="Zone ID"
                              value={zone.id}
                              onChange={(e) => updateDropZone(index, 'id', e.target.value)}
                              className="p-2 border rounded-md text-sm"
                            />
                            <input
                              type="url"
                              placeholder="Image URL"
                              value={zone.image}
                              onChange={(e) => updateDropZone(index, 'image', e.target.value)}
                              className="p-2 border rounded-md text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Label"
                              value={zone.label}
                              onChange={(e) => updateDropZone(index, 'label', e.target.value)}
                              className="p-2 border rounded-md text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Accepts Item ID"
                              value={zone.acceptsId}
                              onChange={(e) => updateDropZone(index, 'acceptsId', e.target.value)}
                              className="p-2 border rounded-md text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 animate__animated animate__fadeInUp animate__delay-4s">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPageModal;