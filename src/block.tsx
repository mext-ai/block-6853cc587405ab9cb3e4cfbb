import React, { useState, useEffect, useRef } from 'react';

interface BlockProps {
  title?: string;
  description?: string;
}

interface RhythmPattern {
  id: number;
  name: string;
  pattern: ('clap' | 'stamp' | 'pause')[];
  difficulty: number;
  character: string;
  characterColor: string;
}

const Block: React.FC<BlockProps> = ({ title, description }) => {
  const [currentStage, setCurrentStage] = useState<'intro' | 'watch' | 'practice' | 'simon' | 'complete'>('intro');
  const [currentPattern, setCurrentPattern] = useState<RhythmPattern | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerPattern, setPlayerPattern] = useState<('clap' | 'stamp')[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState<string>('');
  const [animatingBeat, setAnimatingBeat] = useState(-1);
  const [gameMode, setGameMode] = useState<'learn' | 'simon'>('learn');
  const [simonRound, setSimonRound] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [completedPatterns, setCompletedPatterns] = useState<number[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define rhythm patterns with increasing complexity
  const rhythmPatterns: RhythmPattern[] = [
    {
      id: 1,
      name: "Simple Clap",
      pattern: ['clap', 'pause', 'clap', 'pause'],
      difficulty: 1,
      character: "🎵",
      characterColor: "#FF6B6B"
    },
    {
      id: 2,
      name: "Quick Claps",
      pattern: ['clap', 'clap', 'pause', 'clap'],
      difficulty: 2,
      character: "🎼",
      characterColor: "#4ECDC4"
    },
    {
      id: 3,
      name: "Clap & Stamp",
      pattern: ['clap', 'stamp', 'clap', 'pause'],
      difficulty: 3,
      character: "🎶",
      characterColor: "#45B7D1"
    },
    {
      id: 4,
      name: "Complex Mix",
      pattern: ['clap', 'clap', 'stamp', 'pause', 'clap'],
      difficulty: 4,
      character: "🎤",
      characterColor: "#96CEB4"
    },
    {
      id: 5,
      name: "Master Beat",
      pattern: ['clap', 'stamp', 'clap', 'stamp', 'clap'],
      difficulty: 5,
      character: "🌟",
      characterColor: "#FFEAA7"
    }
  ];

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    initAudio();
  }, []);

  // Play sound function
  const playSound = (frequency: number, duration: number = 0.2) => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  };

  // Play pattern demonstration
  const playPattern = (pattern: RhythmPattern) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setAnimatingBeat(0);
    
    pattern.pattern.forEach((beat, index) => {
      setTimeout(() => {
        setAnimatingBeat(index);
        if (beat === 'clap') {
          playSound(800, 0.15);
        } else if (beat === 'stamp') {
          playSound(200, 0.2);
        }
        
        if (index === pattern.pattern.length - 1) {
          setTimeout(() => {
            setIsPlaying(false);
            setAnimatingBeat(-1);
          }, 600);
        }
      }, index * 600);
    });
  };

  // Handle player input
  const handlePlayerInput = (action: 'clap' | 'stamp') => {
    if (isPlaying || currentStage !== 'practice') return;
    
    const newPattern = [...playerPattern, action];
    setPlayerPattern(newPattern);
    
    // Play sound for feedback
    if (action === 'clap') {
      playSound(800, 0.15);
    } else {
      playSound(200, 0.2);
    }
    
    // Check if pattern is complete
    const expectedPattern = currentPattern?.pattern.filter(beat => beat !== 'pause') || [];
    
    if (newPattern.length === expectedPattern.length) {
      checkPattern(newPattern, expectedPattern);
    }
  };

  // Check if player pattern matches expected pattern
  const checkPattern = (playerPat: ('clap' | 'stamp')[], expectedPat: ('clap' | 'stamp')[]) => {
    const isCorrect = playerPat.length === expectedPat.length && 
                     playerPat.every((beat, index) => beat === expectedPat[index]);
    
    if (isCorrect) {
      setScore(score + 10 * level);
      setFeedback('🎉 Perfect! You got it right!');
      setCompletedPatterns([...completedPatterns, currentPattern?.id || 0]);
      
      setTimeout(() => {
        if (level < rhythmPatterns.length) {
          setLevel(level + 1);
          setCurrentStage('watch');
          setPlayerPattern([]);
          setFeedback('');
        } else {
          setCurrentStage('simon');
          setGameMode('simon');
          setFeedback('Amazing! Now let\'s try Simon Says mode!');
        }
      }, 2000);
    } else {
      setFeedback('🤔 Not quite right. Watch again and try!');
      setPlayerPattern([]);
      setTimeout(() => {
        setFeedback('');
        playPattern(currentPattern!);
      }, 1500);
    }
  };

  // Start learning mode
  const startLearning = () => {
    setCurrentStage('watch');
    setCurrentPattern(rhythmPatterns[level - 1]);
    setShowInstructions(false);
  };

  // Start Simon Says mode
  const startSimonMode = () => {
    setGameMode('simon');
    setCurrentStage('simon');
    setSimonRound(1);
    setCurrentPattern(rhythmPatterns[Math.floor(Math.random() * 3)]); // Use easier patterns for Simon
  };

  // Send completion event
  const sendCompletionEvent = () => {
    const completionData = {
      type: 'BLOCK_COMPLETION',
      blockId: '6853cc587405ab9cb3e4cfbb',
      completed: true,
      score: score,
      maxScore: 250, // 5 patterns × 50 points max
      timeSpent: Date.now(),
      data: {
        level: level,
        completedPatterns: completedPatterns.length,
        gameMode: gameMode
      }
    };
    
    window.postMessage(completionData, '*');
    window.parent.postMessage(completionData, '*');
  };

  // Complete the activity
  const completeActivity = () => {
    setCurrentStage('complete');
    sendCompletionEvent();
  };

  // Effect to handle pattern progression
  useEffect(() => {
    if (currentStage === 'watch' && currentPattern) {
      setTimeout(() => {
        playPattern(currentPattern);
      }, 1000);
      
      setTimeout(() => {
        setCurrentStage('practice');
        setFeedback('Now you try! Tap the buttons to copy the rhythm.');
      }, 5000);
    }
  }, [currentStage, currentPattern]);

  // Effect to handle level progression
  useEffect(() => {
    if (level <= rhythmPatterns.length) {
      setCurrentPattern(rhythmPatterns[level - 1]);
    }
  }, [level]);

  // Render beat visualization
  const renderBeatVisualization = (pattern: RhythmPattern) => {
    return (
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center',
        alignItems: 'center',
        margin: '20px 0'
      }}>
        {pattern.pattern.map((beat, index) => (
          <div
            key={index}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              backgroundColor: animatingBeat === index ? '#FFD700' : 
                             beat === 'clap' ? '#FF6B6B' :
                             beat === 'stamp' ? '#4ECDC4' : '#DDD',
              color: beat === 'pause' ? '#999' : 'white',
              transform: animatingBeat === index ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.3s ease',
              border: '3px solid white',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            {beat === 'clap' ? '👏' : beat === 'stamp' ? '🦶' : '⏸️'}
          </div>
        ))}
      </div>
    );
  };

  // Render instructions screen
  if (showInstructions) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white',
        fontFamily: 'Comic Sans MS, cursive'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
            🕵️‍♀️ Rhythm Detective!
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', lineHeight: '1.6' }}>
            Welcome, young detective! Your mission is to solve the rhythm mysteries by copying the beat patterns you see and hear.
          </p>
          
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>How to Play:</h3>
            <div style={{ textAlign: 'left', display: 'inline-block' }}>
              <p>🎵 1. Watch the animated character show you a rhythm</p>
              <p>👏 2. Copy the pattern using Clap and Stamp buttons</p>
              <p>⭐ 3. Complete all levels to become a Rhythm Master!</p>
              <p>🎮 4. Try Simon Says mode for an extra challenge!</p>
            </div>
          </div>
          
          <button
            onClick={startLearning}
            style={{
              fontSize: '1.5rem',
              padding: '15px 30px',
              backgroundColor: '#FF6B6B',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Comic Sans MS, cursive',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🚀 Start Detective Mission!
          </button>
        </div>
      </div>
    );
  }

  // Render completion screen
  if (currentStage === 'complete') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white',
        fontFamily: 'Comic Sans MS, cursive',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
            🎉 Congratulations, Rhythm Detective! 🎉
          </h1>
          <p style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
            You've successfully solved all the rhythm mysteries!
          </p>
          <div style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
            <p>🏆 Final Score: {score} points</p>
            <p>📊 Patterns Completed: {completedPatterns.length}/{rhythmPatterns.length}</p>
            <p>🎯 Level Reached: {level}</p>
          </div>
          <div style={{ fontSize: '2rem' }}>
            🌟 You're now a certified Rhythm Master! 🌟
          </div>
        </div>
      </div>
    );
  }

  // Main game interface
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      color: 'white',
      fontFamily: 'Comic Sans MS, cursive'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '800px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🕵️‍♀️ Rhythm Detective</h2>
          <p style={{ margin: '5px 0', fontSize: '1rem', opacity: 0.8 }}>Level {level}/5</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '1.2rem' }}>Score: {score}</p>
          <p style={{ margin: '5px 0', fontSize: '0.9rem', opacity: 0.8 }}>
            Completed: {completedPatterns.length}/{rhythmPatterns.length}
          </p>
        </div>
      </div>

      {/* Character and Pattern Display */}
      {currentPattern && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '20px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          minWidth: '400px'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '10px',
            color: currentPattern.characterColor
          }}>
            {currentPattern.character}
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
            {currentPattern.name}
          </h3>
          
          {renderBeatVisualization(currentPattern)}
          
          <button
            onClick={() => playPattern(currentPattern)}
            disabled={isPlaying}
            style={{
              fontSize: '1.2rem',
              padding: '10px 20px',
              backgroundColor: isPlaying ? '#999' : '#4ECDC4',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Comic Sans MS, cursive',
              marginTop: '10px'
            }}
          >
            {isPlaying ? '🎵 Playing...' : '🔊 Play Pattern'}
          </button>
        </div>
      )}

      {/* Player Input Section */}
      {currentStage === 'practice' && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <h4 style={{ marginBottom: '15px', fontSize: '1.3rem' }}>Your Turn!</h4>
          
          {/* Player pattern display */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px',
            minHeight: '40px'
          }}>
            {playerPattern.map((beat, index) => (
              <div
                key={index}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  backgroundColor: beat === 'clap' ? '#FF6B6B' : '#4ECDC4',
                  color: 'white',
                  border: '2px solid white'
                }}
              >
                {beat === 'clap' ? '👏' : '🦶'}
              </div>
            ))}
          </div>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button
              onClick={() => handlePlayerInput('clap')}
              style={{
                fontSize: '1.5rem',
                padding: '15px 25px',
                backgroundColor: '#FF6B6B',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Comic Sans MS, cursive'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              👏 CLAP
            </button>
            
            <button
              onClick={() => handlePlayerInput('stamp')}
              style={{
                fontSize: '1.5rem',
                padding: '15px 25px',
                backgroundColor: '#4ECDC4',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Comic Sans MS, cursive'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🦶 STAMP
            </button>
          </div>
          
          <button
            onClick={() => setPlayerPattern([])}
            style={{
              fontSize: '1rem',
              padding: '8px 16px',
              backgroundColor: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              marginTop: '15px',
              fontFamily: 'Comic Sans MS, cursive'
            }}
          >
            🔄 Reset
          </button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: '15px',
          padding: '15px 25px',
          marginBottom: '20px',
          fontSize: '1.3rem',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          {feedback}
        </div>
      )}

      {/* Simon Says Mode Button */}
      {completedPatterns.length >= 3 && gameMode === 'learn' && (
        <button
          onClick={startSimonMode}
          style={{
            fontSize: '1.3rem',
            padding: '12px 24px',
            backgroundColor: '#9B59B6',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'Comic Sans MS, cursive',
            marginTop: '10px'
          }}
        >
          🎮 Try Simon Says Mode!
        </button>
      )}

      {/* Complete Activity Button */}
      {completedPatterns.length === rhythmPatterns.length && (
        <button
          onClick={completeActivity}
          style={{
            fontSize: '1.4rem',
            padding: '15px 30px',
            backgroundColor: '#27AE60',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'Comic Sans MS, cursive',
            marginTop: '20px'
          }}
        >
          🏆 Complete Activity
        </button>
      )}
    </div>
  );
};

export default Block;