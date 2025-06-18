import React, { useState } from 'react';
import { X, Save, Loader, Music } from 'lucide-react';

interface EditPageModalProps {
  onClose: () => void;
  pageContent: {
    title: string;
    text: string;
    image: string;
    video: string;
    background: string;
    backgroundMusic?: string;
    quiz?: {
      multipleChoice: {
        question: string;
        options: { text: string; isCorrect: boolean; }[];
      };
      spelling: {
        word: string;
        hint: string;
      };
    };
  };
  onSave: (content: {
    title: string;
    text: string;
    image: string;
    video: string;
    background: string;
    backgroundMusic?: string;
    quiz?: {
      multipleChoice: {
        question: string;
        options: { text: string; isCorrect: boolean; }[];
      };
      spelling: {
        word: string;
        hint: string;
      };
    };
  }) => Promise<void>;
}

const EditPageModal = ({ onClose, pageContent, onSave }: EditPageModalProps) => {
  const [content, setContent] = useState({
    ...pageContent,
    video: pageContent.video || pageContent.image, // Fallback to image if no video
    backgroundMusic: pageContent.backgroundMusic || '',
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
      }
    }
  });

  const [showQuizEdit, setShowQuizEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await onSave(content);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
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
              Page Title
            </label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
              placeholder="Enter page title..."
            />
          </div>

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

          {/* Background Music Section */}
          <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-2s">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Music size={16} className="text-purple-600" />
              Background Music URL (Optional)
            </label>
            <input
              type="url"
              value={content.backgroundMusic}
              onChange={(e) => setContent({ ...content, backgroundMusic: e.target.value })}
              className="w-full p-2 border rounded-md transition-all duration-300 focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com/background-music.mp3"
            />
            {content.backgroundMusic && (
              <div className="mt-2">
                <audio
                  src={content.backgroundMusic}
                  controls
                  className="w-full max-w-xs"
                  onError={(e) => {
                    const target = e.target as HTMLAudioElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <p className="text-xs text-gray-500">
              Add ambient background music that will play softly while reading this page. 
              Users can enable/disable and control volume in page settings.
            </p>
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
              </div>
            )}
          </div>
          
          {/* Save Error Display */}
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate__animated animate__fadeIn">
              <p className="text-red-700 text-sm">{saveError}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-2 animate__animated animate__fadeInUp animate__delay-4s">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPageModal;