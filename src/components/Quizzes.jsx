import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretLeft, CaretRight, CheckCircle, Plus, Trash } from '@phosphor-icons/react';

export function Quizzes({ courses, quizzes, onCreateQuiz, onDeleteQuiz }) {
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null); // quiz object currently playing
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> selectedOption
  const [quizFinished, setQuizFinished] = useState(false);

  // Quiz Builder states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [questionsList, setQuestionsList] = useState([]);
  
  // Current question inputs
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [builderError, setBuilderError] = useState('');

  // Group quizzes by course
  const quizCountsByCourse = courses.reduce((acc, course) => {
    const courseQuizzes = quizzes.filter(q => q.courseId === course.id);
    acc[course.id] = courseQuizzes.length;
    return acc;
  }, {});

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedCourseQuizzes = quizzes.filter(q => q.courseId === selectedCourseId);

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setQuizFinished(false);
  };

  const handleSelectOption = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    activeQuiz.questions.forEach(q => {
      if (answers[q.id] === q.answer) score++;
    });
    return score;
  };

  const handleAddQuestion = () => {
    setBuilderError('');
    if (!qText.trim()) {
      setBuilderError('Please enter the question text.');
      return;
    }
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      setBuilderError('Please fill out all 4 options.');
      return;
    }

    const options = [optA.trim(), optB.trim(), optC.trim(), optD.trim()];
    const answer = correctOpt === 'A' ? options[0] : 
                   correctOpt === 'B' ? options[1] : 
                   correctOpt === 'C' ? options[2] : options[3];

    const newQ = {
      id: Date.now() + Math.random(),
      text: qText.trim(),
      options,
      answer
    };

    setQuestionsList(prev => [...prev, newQ]);
    
    // Reset question inputs
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOpt('A');
  };

  const handlePublishQuiz = () => {
    setBuilderError('');
    if (!quizTitle.trim()) {
      setBuilderError('Please enter a quiz title.');
      return;
    }
    if (questionsList.length === 0) {
      setBuilderError('Please add at least one question to the quiz.');
      return;
    }

    onCreateQuiz({
      title: quizTitle.trim(),
      courseId: selectedCourseId,
      courseName: selectedCourse.name,
      questionCount: questionsList.length,
      type: 'multiple choice',
      questions: questionsList
    });

    // Reset Builder
    setQuizTitle('');
    setQuestionsList([]);
    setShowCreateForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* 1. Play Quiz Modal */}
      <AnimatePresence>
        {activeQuiz && (
          <div className="quiz-modal-overlay">
            <motion.div 
              className="quiz-modal nm-out"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {!quizFinished ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                      Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
                    </span>
                    <button 
                      className="cohort-btn" 
                      onClick={() => setActiveQuiz(null)}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Exit
                    </button>
                  </div>
                  
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
                    {activeQuiz.questions[currentQuestionIdx].text}
                  </h3>

                  <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeQuiz.questions[currentQuestionIdx].options.map(opt => (
                      <button
                        key={opt}
                        className={`quiz-option-btn nm-out ${answers[activeQuiz.questions[currentQuestionIdx].id] === opt ? 'selected' : ''}`}
                        onClick={() => handleSelectOption(activeQuiz.questions[currentQuestionIdx].id, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <button
                    className="cohort-btn cohort-btn-primary"
                    disabled={!answers[activeQuiz.questions[currentQuestionIdx].id]}
                    onClick={nextQuestion}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <span>{currentQuestionIdx === activeQuiz.questions.length - 1 ? 'Finish' : 'Next Question'}</span>
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <CheckCircle size={48} weight="fill" style={{ color: 'var(--accent-secondary)', marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Quiz Completed!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    You scored <strong>{calculateScore()}</strong> out of <strong>{activeQuiz.questions.length}</strong> questions correctly.
                  </p>
                  <button 
                    className="cohort-btn cohort-btn-primary" 
                    onClick={() => setActiveQuiz(null)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Main Quizzes Content Screen */}
      {!selectedCourseId ? (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Quizzes</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Practice quizzes from your courses. Tap a course to see its quizzes.
          </p>

          <div className="quizzes-vertical-list">
            {courses.map(course => {
              const quizCount = quizCountsByCourse[course.id] || 0;
              return (
                <div 
                  key={course.id}
                  className="quiz-course-card"
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  <div>
                    <span className="quiz-course-title">{course.name}</span>
                    <div className="quiz-course-count">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', marginRight: '8px' }}></span>
                      {quizCount} {quizCount === 1 ? 'quiz' : 'quizzes'}
                    </div>
                  </div>
                  <CaretRight size={16} className="chevron-arrow" />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. Opened Course Quizzes Screen */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button className="back-arrow-btn" onClick={() => { setSelectedCourseId(null); setShowCreateForm(false); }} aria-label="Back" style={{ margin: 0 }}>
              <CaretLeft size={16} weight="bold" />
            </button>
            <button 
              className="cohort-btn" 
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {showCreateForm ? 'Cancel' : '+ Create Quiz'}
            </button>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{selectedCourse?.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            {selectedCourseQuizzes.length} {selectedCourseQuizzes.length === 1 ? 'quiz' : 'quizzes'} available.
          </p>

          {/* Quiz Builder Form */}
          {showCreateForm && (
            <div className="cohort-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Create New MCQ Quiz</h3>
              
              {builderError && (
                <div className="alert-box" style={{ marginBottom: '16px' }}>
                  <span>{builderError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Quiz Title</label>
                <input 
                  type="text" 
                  className="cohort-input" 
                  placeholder="e.g. Midsem Prep MCQ" 
                  value={quizTitle} 
                  onChange={e => setQuizTitle(e.target.value)}
                />
              </div>

              {/* Added Questions List */}
              {questionsList.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Added Questions ({questionsList.length})</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    {questionsList.map((q, idx) => (
                      <div key={idx} style={{ fontSize: '12px', padding: '8px 12px', background: 'var(--bg-navigation)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{idx + 1}. {q.text}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: '700' }}>Ans: {q.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Input Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>Add Question</h4>
                <div className="form-group">
                  <input 
                    type="text" 
                    className="cohort-input" 
                    placeholder="Enter question text..." 
                    value={qText} 
                    onChange={e => setQText(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <input type="text" className="cohort-input" placeholder="Option A" value={optA} onChange={e => setOptA(e.target.value)} />
                  <input type="text" className="cohort-input" placeholder="Option B" value={optB} onChange={e => setOptB(e.target.value)} />
                  <input type="text" className="cohort-input" placeholder="Option C" value={optC} onChange={e => setOptC(e.target.value)} />
                  <input type="text" className="cohort-input" placeholder="Option D" value={optD} onChange={e => setOptD(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Correct Option</label>
                  <select className="cohort-select" value={correctOpt} onChange={e => setCorrectOpt(e.target.value)}>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" className="cohort-btn" onClick={handleAddQuestion} style={{ flex: 1 }}>
                    + Add Question
                  </button>
                  <button type="button" className="cohort-btn cohort-btn-primary" onClick={handlePublishQuiz} disabled={questionsList.length === 0 && !quizTitle} style={{ flex: 1 }}>
                    Publish Quiz
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="quizzes-vertical-list">
            {selectedCourseQuizzes.length > 0 ? (
              selectedCourseQuizzes.map(quiz => (
                <div key={quiz.id} className="quiz-item-card">
                  <div className="quiz-item-info">
                    <span className="quiz-item-title">{quiz.title}</span>
                    <span className="quiz-item-questions">{quiz.questionCount} MCQ questions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                      className="start-quiz-link"
                      onClick={() => startQuiz(quiz)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <span>Start</span>
                      <CaretRight size={14} weight="bold" />
                    </button>
                    <button 
                      className="cohort-btn"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete quiz "${quiz.title}"?`)) {
                          onDeleteQuiz(quiz.id);
                        }
                      }}
                      style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                      title="Delete quiz"
                    >
                      <Trash size={15} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="cohort-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                No quizzes available for this course subject.
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
