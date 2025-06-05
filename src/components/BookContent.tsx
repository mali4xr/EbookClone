import React, { useEffect, useState, useRef } from 'react';
import { useBook } from '../context/BookContext';
import PageTurner from './PageTurner';
import Controls from './Controls';
import PageCounter from './PageCounter';
import InteractiveElements from './InteractiveElements';
import { QuizModal } from './QuizModal';

const BookContent = () => {
  const { 
    currentPage,
    totalPages,
    pageContent,
    currentWord,
    isReading,
    hasStartedReading
  } = useBook();
  
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isPageComplete, setIsPageComplete] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showAvatar, setShowAvatar] = useState(false);
  const [conversationUrl, setConversationUrl] = useState('');
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [isAvatarJoined, setIsAvatarJoined] = useState(false);
  const callRef = useRef(null);
  const avatarContainerRef = useRef(null);
  
  useEffect(() => {
    setIsPageTurning(true);
    const timeout = setTimeout(() => setIsPageTurning(false), 500);
    return () => clearTimeout(timeout);
  }, [currentPage]);

  useEffect(() => {
    if (pageContent && pageContent.text) {
      const totalWords = pageContent.text.split(' ').length;
      const isComplete = currentWord >= totalWords - 1;
      setIsPageComplete(isComplete);
    }
  }, [currentWord, pageContent]);

  useEffect(() => {
    setIsPageComplete(false);
    setShowQuiz(false);
  }, [currentPage]);

  useEffect(() => {
    if (hasStartedReading && !isReading && isPageComplete) {
      setShowQuiz(true);
    }
  }, [isReading, hasStartedReading, isPageComplete]);

  const createConversation = async () => {
    setIsLoadingAvatar(true);
    setAvatarError('');
    
    try {
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '22dd0f54ba6c443ba15f03990f302a1b'
        },
        body: JSON.stringify({
          replica_id: 'r9fa0878977a',
          persona_id: 'pb158ac8e30e',
          conversation_name: 'Book Reading Session',
          conversational_context: 'You are helping a user read through a book. Provide encouragement and help explain content when needed. Be friendly and supportive.',
          properties: {
            max_call_duration: 3600,
            enable_recording: false,
            participant_left_timeout: 60,
            participant_absent_timeout: 300
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.conversation_url) {
        setConversationUrl(data.conversation_url);
        return data.conversation_url;
      } else {
        throw new Error('No conversation URL returned');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setAvatarError('Failed to create avatar conversation. Please try again.');
      return null;
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  const initializeAvatar = async (url) => {
    if (!window.Daily) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.onload = () => setupDailyCall(url);
      script.onerror = () => {
        setAvatarError('Failed to load Daily SDK');
        setIsLoadingAvatar(false);
      };
      document.head.appendChild(script);
    } else {
      setupDailyCall(url);
    }
  };

  const setupDailyCall = (url) => {
    if (avatarContainerRef.current && url) {
      try {
        callRef.current = window.Daily.createFrame({
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '8px'
          },
          showLeaveButton: false,
          showFullscreenButton: false
        });

        avatarContainerRef.current.appendChild(callRef.current.iframe());
        
        callRef.current.on('joined-meeting', () => {
          console.log('Successfully joined avatar conversation');
          setIsAvatarJoined(true);
          setIsLoadingAvatar(false);
        });
        
        callRef.current.on('left-meeting', () => {
          console.log('Left avatar conversation');
          setIsAvatarJoined(false);
        });
        
        callRef.current.on('error', (error) => {
          console.error('Daily call error:', error);
          setAvatarError('Avatar connection failed');
          setIsLoadingAvatar(false);
          setIsAvatarJoined(false);
        });

        callRef.current.on('app-message', (event) => {
          console.log('Avatar message:', event);
        });

        callRef.current.join({ url });
      } catch (error) {
        console.error('Error setting up Daily call:', error);
        setAvatarError('Failed to setup avatar call');
        setIsLoadingAvatar(false);
        setIsAvatarJoined(false);
      }
    }
  };

  const sendMessageToAvatar = (text) => {
    if (callRef.current && text && isAvatarJoined) {
      try {
        const interaction = {
          message_type: 'conversation',
          event_type: 'conversation.echo',
          conversation_id: conversationUrl.split('/').pop(),
          properties: { text }
        };
        
        callRef.current.sendAppMessage(interaction, '*');
      } catch (error) {
        console.error('Error sending message to avatar:', error);
      }
    }
  };

  const handleAvatarToggle = async () => {
    if (!showAvatar) {
      if (!conversationUrl) {
        const url = await createConversation();
        if (url) {
          await initializeAvatar(url);
        } else {
          return;
        }
      }
      setShowAvatar(true);
    } else {
      if (callRef.current) {
        try {
          callRef.current.leave();
          callRef.current.destroy();
          callRef.current = null;
          setIsAvatarJoined(false);
        } catch (error) {
          console.error('Error cleaning up Daily call:', error);
        }
      }
      setShowAvatar(false);
    }
  };

  const handleReadPage = () => {
    if (pageContent && pageContent.text && isAvatarJoined) {
      sendMessageToAvatar(`Please read this page: ${pageContent.text}`);
    } else if (!isAvatarJoined) {
      setAvatarError('Avatar not connected. Please wait for avatar to join.');
    }
  };

  useEffect(() => {
    if (isPageComplete && showAvatar && pageContent && isAvatarJoined) {
      const congratsMessage = `Great job! You've completed page ${currentPage + 1}. ${pageContent.summary || 'Ready for the next page?'}`;
      sendMessageToAvatar(congratsMessage);
    }
  }, [isPageComplete, showAvatar, currentPage, pageContent, isAvatarJoined]);

  useEffect(() => {
    return () => {
      if (callRef.current) {
        try {
          callRef.current.leave();
          callRef.current.destroy();
          setIsAvatarJoined(false);
        } catch (error) {
          console.error('Error cleaning up on unmount:', error);
        }
      }
    };
  }, []);

  const renderHighlightedText = (text) => {
    const words = text.split(' ');
    return words.map((word, index) => (
      <span
        key={index}
        className={`inline-block transition-all duration-150 mx-[2px] px-1 rounded ${
          index === currentWord ? 'bg-yellow-300 -skew-x-3 scale-105' : 
          index < currentWord ? 'bg-green-100' : ''
        }`}
      >
        {word}
      </span>
    ));
  };

  return (
    <div className="flex flex-col h-[600px] md:h-[700px]">
      <div 
        className="flex-grow relative overflow-hidden"
        style={{
          backgroundImage: `url(${pageContent.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div 
          className={`absolute inset-0 flex flex-col md:flex-row transition-opacity duration-500 ${
            isPageTurning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <p className="text-xl md:text-2xl leading-relaxed text-gray-800 font-medium mb-4">
                {renderHighlightedText(pageContent.text)}
              </p>
              {isPageComplete && (
                <div className="text-sm text-green-600 font-semibold mt-2">
                  ✓ Page completed
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-1/2 relative">
            <div className="absolute top-4 right-4">
              <img 
                src={pageContent.image} 
                alt={`Illustration for page ${currentPage + 1}`} 
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-xl"
              />
            </div>
            <InteractiveElements page={currentPage} />
          </div>
        </div>

        {showAvatar && (
          <div className="absolute bottom-4 left-4 z-50">
            <div className="bg-white rounded-lg p-3 shadow-xl border-2 border-blue-300 max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Reading Assistant</h3>
                <button
                  onClick={() => setShowAvatar(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ✕
                </button>
              </div>
              
              <div 
                ref={avatarContainerRef}
                className="w-80 h-48 rounded-lg overflow-hidden bg-gray-100 relative"
              >
                {isLoadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading avatar...</p>
                    </div>
                  </div>
                )}
                
                {avatarError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                    <div className="text-center p-4">
                      <p className="text-sm text-red-600 mb-2">{avatarError}</p>
                      <button
                        onClick={() => {
                          setAvatarError('');
                          handleAvatarToggle();
                        }}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200">
        <div className="flex items-center gap-4 mx-auto sm:mx-0">
          <PageCounter current={currentPage + 1} total={totalPages} />
          <PageTurner isLocked={quizScore < 2} />
          <Controls />
          
          <div className="flex gap-2">
            <button
              onClick={handleAvatarToggle}
              disabled={isLoadingAvatar}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAvatar 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${isLoadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoadingAvatar ? 'Loading...' : showAvatar ? 'Hide Avatar' : 'Show Avatar'}
            </button>
            <button
              onClick={handleReadPage}
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!pageContent || !isAvatarJoined}
            >
              Read Page
            </button>
          </div>
        </div>
      </div>

      {showQuiz && (
        <QuizModal
          onClose={() => setShowQuiz(false)}
          pageContent={pageContent}
          onScoreUpdate={setQuizScore}
        />
      )}
    </div>
  );
};

export default BookContent;