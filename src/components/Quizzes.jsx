import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Trash, Warning, CheckCircle, Copy, Play, ArrowLeft, ArrowRight, ArrowCounterClockwise, Star, Trophy, Sparkle 
} from '@phosphor-icons/react';

export function Quizzes({ courses, quizzes, quizAttempts, onCreateQuiz, onDeleteQuiz, onSaveAttempt }) {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active Test Run State
  const [currentQuestions, setCurrentQuestions] = useState([]); // Shuffled list
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // MCQ choice / Theory text input
  const [mcqLockedQuestions, setMcqLockedQuestions] = useState({}); // Stores correctness state of immediately answered MCQ questions
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [theorySelfGrading, setTheorySelfGrading] = useState({}); // Maps question id to user self-graded score (0 or 1)

  const showNotification = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleCopyPrompt = () => {
    const promptText = `Generate a study quiz based on my study material in the exact JSON format below. Return ONLY the JSON code block, nothing else.\n\n` +
      `JSON Format for Multiple Choice (MCQ):\n` +
      `{\n` +
      `  "title": "Quiz Title",\n` +
      `  "type": "mcq",\n` +
      `  "questions": [\n` +
      `    {\n` +
      `      "id": 1,\n` +
      `      "text": "What is the capital of France?",\n` +
      `      "options": ["Paris", "London", "Berlin", "Rome"],\n` +
      `      "answer": "Paris"\n` +
      `    }\n` +
      `  ]\n` +
      `}\n\n` +
      `JSON Format for Theory (Open-Ended):\n` +
      `{\n` +
      `  "title": "Quiz Title",\n` +
      `  "type": "theory",\n` +
      `  "questions": [\n` +
      `    {\n` +
      `      "id": 1,\n` +
      `      "text": "Explain the concept of pipelining in computer architecture.",\n` +
      `      "sampleAnswer": "Pipelining overlaps the execution of multiple instructions using separate stages."\n` +
      `    }\n` +
      `  ]\n` +
      `}`;

    navigator.clipboard.writeText(promptText);
    showNotification("AI Quiz Prompt template copied to clipboard!");
  };

  const handleAddQuizSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const parsed = JSON.parse(pastedJson.trim());
      
      // Basic schema validations
      if (!parsed.title || !parsed.type || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error("Missing title, type, or valid questions array.");
      }

      if (parsed.type !== 'mcq' && parsed.type !== 'theory') {
        throw new Error("Type must be either 'mcq' or 'theory'.");
      }

      parsed.questions.forEach((q, idx) => {
        if (!q.text) throw new Error(`Question ${idx + 1} is missing a query text.`);
        if (parsed.type === 'mcq') {
          if (!Array.isArray(q.options) || q.options.length < 2 || !q.answer) {
            throw new Error(`MCQ Question ${idx + 1} requires options (at least 2) and a correct answer.`);
          }
        } else if (parsed.type === 'theory') {
          if (!q.sampleAnswer) {
            throw new Error(`Theory Question ${idx + 1} is missing a sampleAnswer.`);
          }
        }
      });

      // Save to database
      onCreateQuiz({
        title: parsed.title,
        courseId: courses[0]?.id || 'none',
        courseName: courses[0]?.name || 'General',
        questionCount: parsed.questions.length,
        type: parsed.type,
        questions: parsed.questions
      });

      showNotification("Quiz parsed and added successfully!");
      setPastedJson('');
      setShowAddModal(false);
    } catch (err) {
      setErrorMsg(`Invalid JSON structure: ${err.message}`);
    }
  };

  // Start a new quiz attempt (Shuffling logic)
  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setMcqLockedQuestions({});
    setTheorySelfGrading({});
    setIsTestCompleted(false);

    // Shuffle questions
    let shuffledQ = [...quiz.questions].sort(() => Math.random() - 0.5);
    
    // For MCQs, also shuffle the options for each question
    if (quiz.type === 'mcq') {
      shuffledQ = shuffledQ.map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
      }));
    }

    setCurrentQuestions(shuffledQ);
  };

  // MCQ answer handler (Immediate feedback)
  const handleSelectMcq = (questionId, selectedOption, correctAnswer) => {
    if (mcqLockedQuestions[questionId]) return; // Already locked

    const isCorrect = selectedOption === correctAnswer;
    setUserAnswers(prev => ({ ...prev, [questionId]: selectedOption }));
    setMcqLockedQuestions(prev => ({ 
      ...prev, 
      [questionId]: { isCorrect, selectedOption, correctAnswer } 
    }));
  };

  const handleTheoryAnswerChange = (questionId, value) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // End of test submission
  const handleSubmitTest = async () => {
    if (activeQuiz.type === 'mcq') {
      // Calculate MCQ score directly
      let score = 0;
      currentQuestions.forEach(q => {
        if (mcqLockedQuestions[q.id]?.isCorrect) score += 1;
      });

      await onSaveAttempt({
        quizId: activeQuiz.id,
        score,
        maxScore: currentQuestions.length
      });

      setIsTestCompleted(true);
    } else {
      // For theory, move to self-grading panel
      setIsTestCompleted(true);
      // Initialize self grading scores as incorrect by default (0)
      const initialSelfGrading = {};
      currentQuestions.forEach(q => {
        initialSelfGrading[q.id] = 0;
      });
      setTheorySelfGrading(initialSelfGrading);
    }
  };

  // Self grading complete
  const handleFinishSelfGrading = async () => {
    let score = 0;
    Object.values(theorySelfGrading).forEach(v => {
      score += v;
    });

    await onSaveAttempt({
      quizId: activeQuiz.id,
      score,
      maxScore: currentQuestions.length
    });

    showNotification("Theory scores recorded!");
    setActiveQuiz(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {successMsg && (
        <div className="success-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} weight="fill" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-box" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warning size={16} weight="bold" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeQuiz ? (
        /* ============================================================
           ACTIVE QUIZ TEST WINDOW
           ============================================================ */
        <div className="cohort-card nm-out" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{activeQuiz.title}</h3>
            <span className="pref-day-btn active" style={{ fontSize: '10px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '6px' }}>
              {activeQuiz.type.toUpperCase()}
            </span>
          </div>

          {!isTestCompleted ? (
            /* Running/Answering Phase */
            <div>
              {activeQuiz.type === 'mcq' ? (
                /* MCQ Question-by-Question Flow */
                <div>
                  <div style={{ display: 'flex', justify: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                    <span>Question {currentQuestionIndex + 1} of {currentQuestions.length}</span>
                  </div>

                  {currentQuestions.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
                        {currentQuestions[currentQuestionIndex].text}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                        {currentQuestions[currentQuestionIndex].options.map(opt => {
                          const qId = currentQuestions[currentQuestionIndex].id;
                          const locked = mcqLockedQuestions[qId];
                          const isChosen = locked?.selectedOption === opt;
                          const isCorrectOpt = opt === currentQuestions[currentQuestionIndex].answer;

                          let btnStyle = { background: 'var(--bg-navigation)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };
                          if (locked) {
                            if (isCorrectOpt) {
                              btnStyle = { background: '#D1FAE5', border: '1px solid #10B981', color: '#065F46' }; // Correct is always Green
                            } else if (isChosen && !isCorrectOpt) {
                              btnStyle = { background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B' }; // Incorrect choice is Red
                            }
                          }

                          return (
                            <button
                              key={opt}
                              className="cohort-btn"
                              onClick={() => handleSelectMcq(qId, opt, currentQuestions[currentQuestionIndex].answer)}
                              style={{ 
                                ...btnStyle, 
                                padding: '14px 20px', 
                                justifyContent: 'flex-start', 
                                fontSize: '13px', 
                                borderRadius: '10px',
                                pointerEvents: locked ? 'none' : 'auto'
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Navigation buttons */}
                      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                        <button 
                          className="cohort-btn"
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                          style={{ gap: '6px' }}
                        >
                          <ArrowLeft size={16} />
                          Back
                        </button>

                        {currentQuestionIndex < currentQuestions.length - 1 ? (
                          <button 
                            className="cohort-btn cohort-btn-primary"
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            disabled={!mcqLockedQuestions[currentQuestions[currentQuestionIndex].id]}
                            style={{ gap: '6px' }}
                          >
                            Next
                            <ArrowRight size={16} />
                          </button>
                        ) : (
                          <button 
                            className="cohort-btn cohort-btn-primary"
                            onClick={handleSubmitTest}
                            disabled={!mcqLockedQuestions[currentQuestions[currentQuestionIndex].id]}
                            style={{ background: '#10B981', borderColor: '#10B981' }}
                          >
                            Submit Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Theory Entire Work Form Flow */
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
                    {currentQuestions.map((q, idx) => (
                      <div key={q.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
                          {idx + 1}. {q.text}
                        </h4>
                        <textarea 
                          className="cohort-input" 
                          rows={4}
                          placeholder="Type your explanation here..."
                          value={userAnswers[q.id] || ''}
                          onChange={e => handleTheoryAnswerChange(q.id, e.target.value)}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justify: 'space-between' }}>
                    <button className="cohort-btn" onClick={() => setActiveQuiz(null)}>
                      Cancel
                    </button>
                    <button 
                      className="cohort-btn cohort-btn-primary" 
                      onClick={handleSubmitTest}
                      style={{ background: '#10B981', borderColor: '#10B981' }}
                    >
                      Submit Whole Work
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Completed / Grading Phase */
            <div>
              {activeQuiz.type === 'mcq' ? (
                /* MCQ score details screen */
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Trophy size={48} style={{ color: '#F59E0B', margin: '0 auto 16px auto' }} />
                  <h4 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Quiz Completed!</h4>
                  
                  {/* Calculate final score */}
                  {(() => {
                    let score = 0;
                    currentQuestions.forEach(q => {
                      if (mcqLockedQuestions[q.id]?.isCorrect) score += 1;
                    });
                    return (
                      <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        You scored <strong style={{ color: 'var(--accent)', fontSize: '24px' }}>{score}</strong> out of {currentQuestions.length}
                      </p>
                    );
                  })()}

                  <button className="cohort-btn cohort-btn-primary" onClick={() => setActiveQuiz(null)} style={{ margin: '0 auto' }}>
                    Back to Quizzes
                  </button>
                </div>
              ) : (
                /* Theory Side-by-Side Self Grading Panel */
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '24px', color: 'var(--accent)' }}>
                    Grade Your Answers (Compare Side-by-Side)
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '32px' }}>
                    {currentQuestions.map((q, idx) => {
                      const ans = userAnswers[q.id] || '(No answer provided)';
                      const isGradedCorrect = theorySelfGrading[q.id] === 1;

                      return (
                        <div key={q.id} className="cohort-card" style={{ padding: '20px', background: 'var(--bg-navigation)' }}>
                          <h5 style={{ fontSize: '13.5px', fontWeight: '700', marginBottom: '14px' }}>
                            {idx + 1}. {q.text}
                          </h5>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '12.5px' }}>
                              <strong style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>Your Answer:</strong>
                              <p style={{ whiteSpace: 'pre-wrap' }}>{ans}</p>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', fontSize: '12.5px' }}>
                              <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '6px' }}>Model Solution:</strong>
                              <p>{q.sampleAnswer}</p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justify: 'flex-end', gap: '10px' }}>
                            <button
                              className={`cohort-btn ${isGradedCorrect ? 'cohort-btn-primary' : ''}`}
                              onClick={() => setTheorySelfGrading(prev => ({ ...prev, [q.id]: 1 }))}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '11px',
                                background: isGradedCorrect ? '#10B981' : 'transparent',
                                color: isGradedCorrect ? 'white' : 'var(--text-secondary)'
                              }}
                            >
                              Correct (1 pt)
                            </button>
                            <button
                              className={`cohort-btn ${!isGradedCorrect ? 'cohort-btn-primary' : ''}`}
                              onClick={() => setTheorySelfGrading(prev => ({ ...prev, [q.id]: 0 }))}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '11px',
                                background: !isGradedCorrect ? '#EF4444' : 'transparent',
                                color: !isGradedCorrect ? 'white' : 'var(--text-secondary)'
                              }}
                            >
                              Incorrect (0 pt)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button className="cohort-btn cohort-btn-primary" onClick={handleFinishSelfGrading} style={{ width: '100%', justifyContent: 'center' }}>
                    Finish Self-Grading & Record Score
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================
           LIST AND ADD VIEW (NESTED INSIDE A COURSE)
           ============================================================ */
        <div>
          <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Subject Quizzes</h3>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCopyPrompt} className="cohort-btn" style={{ gap: '6px', fontSize: '12px' }}>
                <Copy size={14} />
                <span>Copy AI Quiz Prompt</span>
              </button>
              
              <button 
                onClick={() => setShowAddModal(true)}
                className="cohort-btn cohort-btn-primary"
                style={{ gap: '6px', fontSize: '12px' }}
              >
                <Plus size={14} weight="bold" />
                <span>Paste AI Generated Quiz</span>
              </button>
            </div>
          </div>

          {/* Quizzes list container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {quizzes.length > 0 ? (
              quizzes.map(quiz => {
                // Get attempt history for this quiz
                const attempts = quizAttempts
                  .filter(qa => qa.quizId === quiz.id)
                  .sort((a, b) => b.id.localeCompare(a.id)); // Newest first

                return (
                  <div key={quiz.id} className="cohort-card nm-out" style={{ padding: '24px', display: 'flex', justify: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {quiz.type}
                        </span>
                        <h4 style={{ fontSize: '15px', fontWeight: '800' }}>{quiz.title}</h4>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{quiz.questionCount} Questions</span>
                      
                      {/* Attempts Score History */}
                      <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <strong style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          Attempts & Marks History:
                        </strong>
                        {attempts.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {attempts.map((att, index) => (
                              <span 
                                key={att.id} 
                                style={{ 
                                  fontSize: '10.5px', 
                                  background: 'var(--bg-navigation)', 
                                  padding: '4px 8px', 
                                  borderRadius: '6px', 
                                  color: att.score === att.maxScore ? 'var(--accent)' : 'var(--text-primary)' 
                                }}
                              >
                                Run {attempts.length - index}: {att.score}/{att.maxScore} ({att.attemptDate})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            No attempts recorded yet. Click "Start Quiz" to take your first run.
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                      <button 
                        className="cohort-btn cohort-btn-primary" 
                        onClick={() => handleStartQuiz(quiz)}
                        style={{ gap: '4px', fontSize: '12px' }}
                      >
                        <Play size={12} weight="fill" />
                        Start Quiz
                      </button>
                      <button 
                        className="cohort-btn" 
                        onClick={() => {
                          if (confirm(`Delete quiz "${quiz.title}" and erase its attempt history?`)) {
                            onDeleteQuiz(quiz.id);
                          }
                        }}
                        style={{ padding: '8px' }}
                      >
                        <Trash size={14} style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="cohort-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                No quizzes added for this subject. Copy the prompt template above and paste it into Gemini/ChatGPT to create one!
              </div>
            )}
          </div>

          {/* Paste AI generated modal */}
          {showAddModal && (
            <div className="login-bg-overlay" style={{ zIndex: 1100 }}>
              <div className="login-auth-card nm-out" style={{ maxWidth: '600px', width: '90%' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px', textAlign: 'center' }}>
                  Paste AI Generated Quiz
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: '1.4' }}>
                  Copy your AI agent's JSON code block response and paste it directly below. We'll parse the questions, options, and solutions automatically.
                </p>

                <form onSubmit={handleAddQuizSubmit}>
                  <textarea 
                    className="cohort-input" 
                    rows={12}
                    placeholder='Paste raw JSON here. Example:&#10;{&#10;  "title": "Module 1 Review",&#10;  "type": "mcq",&#10;  "questions": [...]&#10;}'
                    value={pastedJson}
                    onChange={e => setPastedJson(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '11px', resize: 'vertical' }}
                    required
                  />

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="cohort-btn cohort-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      Parse and Add Quiz
                    </button>
                    <button 
                      type="button" 
                      className="cohort-btn" 
                      onClick={() => setShowAddModal(false)}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
export default Quizzes;
