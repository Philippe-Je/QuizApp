// =========================
// Global state
// =========================

let questions = [];
let currentQuestion = 0;
let score = 0;
let userAnswers = [];

let timerId = null;
let timeLeft = 20;
let hasAnsweredCurrent = false;

const NUM_QUESTIONS = 10;

// =========================
// DOM elements
// =========================

const homeScreen = document.getElementById("home-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");

const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");

const timerValueEl = document.getElementById("timer-value");
const timerBadge = document.querySelector(".timer-badge");

// Login / theme elements
const themeToggleBtn = document.getElementById("theme-toggle");
const loginToggleBtn = document.getElementById("login-toggle");
const loginModal = document.getElementById("login-modal");
const closeLoginBtn = document.getElementById("close-login");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username-input");
const passwordInput = document.getElementById("password-input");
const welcomeMessage = document.getElementById("welcome-message");

const modalTitle = document.getElementById("modal-title"); 
const modalText = document.getElementById("modal-text");  
const authSubmitBtn = document.getElementById("auth-submit-btn"); 
const authModeToggle = document.getElementById("auth-mode-toggle");

let authMode = "login";


// Disable Start until questions load
startBtn.disabled = true;
startBtn.textContent = "Loading questions...";

// =========================
// Init
// =========================

document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme();
  loadUserFromStorage();
  loadQuestions();
});

// =========================
// Load questions from /api/questions
// =========================

async function loadQuestions() {
  try {
    const response = await fetch("/api/questions");
    if (!response.ok) {
      throw new Error("Failed to load questions from server.");
    }

    const data = await response.json();

    // Your JSON shape: { question, A, B, C, D, answer: "A" }
    const mapped = data.map((q) => {
      const letters = ["A", "B", "C", "D"];
      const answers = [q.A, q.B, q.C, q.D];
      const correctIndex = letters.indexOf(q.answer);

      return {
        question: q.question,
        answers,
        correct: correctIndex,
      };
    });

    // Randomize question order
    questions = shuffleArray(mapped).slice(0, NUM_QUESTIONS);

    startBtn.disabled = false;
    startBtn.textContent = "Start Quiz Now";

    console.log(`Loaded ${questions.length} questions`);
  } catch (err) {
    console.error(err);
    alert("Error loading questions from server. Check console.");
    startBtn.textContent = "Error loading questions";
  }
}

// Fisher–Yates shuffle
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// =========================
// Screen helpers
// =========================

function showHome() {
  resultsScreen.classList.remove("active");
  quizScreen.classList.remove("active");
  homeScreen.classList.add("active");
}

function showQuiz() {
  homeScreen.classList.remove("active");
  resultsScreen.classList.remove("active");
  quizScreen.classList.add("active");
}

function showResultsScreen() {
  quizScreen.classList.remove("active");
  resultsScreen.classList.add("active");
}

// =========================
// Quiz flow
// =========================

startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", restartQuiz);

function startQuiz() {
  if (!questions || questions.length === 0) {
    alert("Questions are still loading. Please wait a moment.");
    return;
  }

  currentQuestion = 0;
  score = 0;
  userAnswers = [];

  showQuiz();
  loadQuestion();
}

function loadQuestion() {
  clearTimer();
  hasAnsweredCurrent = false;

  const q = questions[currentQuestion];

  document.getElementById("current-question").textContent =
    currentQuestion + 1;
  document.getElementById("question-num").textContent = currentQuestion + 1;
  document
    .getElementById("score-display")
    .querySelector("strong").textContent = score;

  const progressPercent = (currentQuestion / questions.length) * 100;
  document.getElementById("progress-fill").style.width =
    progressPercent + "%";

  document.getElementById("question-text").textContent = q.question;

  const answersContainer = document.getElementById("answers-container");
  answersContainer.innerHTML = "";

  // Randomize answer order per question
  const answersWithIndex = q.answers.map((text, idx) => ({
    text,
    originalIndex: idx,
  }));
  const shuffled = shuffleArray(answersWithIndex);

  shuffled.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = item.text;
    btn.dataset.originalIndex = item.originalIndex.toString();
    btn.addEventListener("click", () =>
      selectAnswer(parseInt(btn.dataset.originalIndex, 10))
    );
    answersContainer.appendChild(btn);
  });

  const feedback = document.getElementById("feedback");
  feedback.classList.add("hidden");
  feedback.classList.remove("correct", "incorrect");
  feedback.querySelector(".feedback-icon").textContent = "";
  feedback.querySelector(".feedback-text").textContent = "";

  nextBtn.classList.add("hidden");

  // Start timer for this question
  startTimer();
}

function selectAnswer(selectedIndex) {
  if (hasAnsweredCurrent) return;
  hasAnsweredCurrent = true;
  clearTimer();

  const q = questions[currentQuestion];
  const answerButtons = document.querySelectorAll(".answer-btn");
  const feedback = document.getElementById("feedback");
  const feedbackIcon = feedback.querySelector(".feedback-icon");
  const feedbackText = feedback.querySelector(".feedback-text");

  answerButtons.forEach((btn) => (btn.disabled = true));

  const isCorrect = selectedIndex === q.correct;

  userAnswers.push({
    question: q.question,
    userAnswer: q.answers[selectedIndex],
    correctAnswer: q.answers[q.correct],
    isCorrect,
  });

  if (isCorrect) {
    score++;
    document
      .getElementById("score-display")
      .querySelector("strong").textContent = score;
  }

  answerButtons.forEach((btn) => {
    const idx = parseInt(btn.dataset.originalIndex, 10);
    if (idx === q.correct) {
      btn.classList.add("correct");
    }
    if (idx === selectedIndex && !isCorrect) {
      btn.classList.add("incorrect");
    }
  });

  feedback.classList.remove("hidden", "correct", "incorrect");
  if (isCorrect) {
    feedback.classList.add("correct");
    feedbackIcon.textContent = "✓";
    feedbackText.textContent = "Correct! Great job!";
  } else {
    feedback.classList.add("incorrect");
    feedbackIcon.textContent = "✗";
    feedbackText.textContent =
      "Incorrect. The correct answer is: " + q.answers[q.correct];
  }

  nextBtn.classList.remove("hidden");
}

function nextQuestion() {
  currentQuestion++;

  if (currentQuestion < questions.length) {
    loadQuestion();
  } else {
    showResults();
  }
}

// showResults now also sends score to backend (if logged in)
function showResults() {
  clearTimer();
  showResultsScreen();

  const totalQuestions = questions.length;
  const correctCount = score;
  const incorrectCount = totalQuestions - score;
  const accuracy = Math.round((score / totalQuestions) * 100);

  document.getElementById("final-score").textContent = score;
  document.getElementById("correct-count").textContent = correctCount;
  document.getElementById("incorrect-count").textContent = incorrectCount;
  document.getElementById("accuracy").textContent = accuracy + "%";

  const performanceMessage = document.getElementById("performance-message");
  if (accuracy >= 90) {
    performanceMessage.textContent = "Outstanding! You're a quiz master!";
  } else if (accuracy >= 70) {
    performanceMessage.textContent = "Great job! You did really well!";
  } else if (accuracy >= 50) {
    performanceMessage.textContent = "Good effort! Keep practicing!";
  } else {
    performanceMessage.textContent = "Don't give up! Try again!";
  }

  // Fire-and-forget: submit score to backend if logged in
  const auth = getAuth();
  if (auth && auth.token) {
    submitScoreToServer({
      category: "random", // for now, local questions = random category
      score,
      totalQuestions,
      accuracy,
    });
  }

  // Build review
  const reviewContainer = document.getElementById("review-container");
  reviewContainer.innerHTML = "";

  userAnswers.forEach((ans, index) => {
    const item = document.createElement("div");
    item.className = `review-item ${ans.isCorrect ? "correct" : "incorrect"}`;

    item.innerHTML = `
      <div class="review-question">Question ${index + 1}: ${
      ans.question
    }</div>
      <div class="review-answer user">
        <span class="icon">${ans.isCorrect ? "✓" : "✗"}</span>
        Your answer: ${ans.userAnswer}
      </div>
      ${
        !ans.isCorrect
          ? `<div class="review-answer correct-answer">
               <span class="icon">✓</span>
               Correct answer: ${ans.correctAnswer}
             </div>`
          : ""
      }
    `;
    reviewContainer.appendChild(item);
  });
}

function restartQuiz() {
  showHome();
}

// =========================
// Timer
// =========================

function startTimer() {
  timeLeft = 20;
  updateTimerDisplay();

  timerId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerDisplay();
      clearTimer();
      if (!hasAnsweredCurrent) {
        handleTimeUp();
      }
    }
  }, 1000);
}

function clearTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  timerBadge.classList.remove("low-time");
}

function updateTimerDisplay() {
  timerValueEl.textContent = timeLeft;
  if (timeLeft <= 5) {
    timerBadge.classList.add("low-time");
  } else {
    timerBadge.classList.remove("low-time");
  }
}

function handleTimeUp() {
  hasAnsweredCurrent = true;

  const q = questions[currentQuestion];
  const answerButtons = document.querySelectorAll(".answer-btn");
  const feedback = document.getElementById("feedback");
  const feedbackIcon = feedback.querySelector(".feedback-icon");
  const feedbackText = feedback.querySelector(".feedback-text");

  answerButtons.forEach((btn) => {
    btn.disabled = true;
    const idx = parseInt(btn.dataset.originalIndex, 10);
    if (idx === q.correct) {
      btn.classList.add("correct");
    }
  });

  userAnswers.push({
    question: q.question,
    userAnswer: "No answer (time ran out)",
    correctAnswer: q.answers[q.correct],
    isCorrect: false,
  });

  feedback.classList.remove("hidden", "correct", "incorrect");
  feedback.classList.add("incorrect");
  feedbackIcon.textContent = "⏰";
  feedbackText.textContent =
    "Time's up! The correct answer is: " + q.answers[q.correct];

  nextBtn.classList.remove("hidden");
}

// =========================
// Auth helpers (frontend)
// =========================

function getAuth() {
  return JSON.parse(localStorage.getItem("bq-auth") || "null");
}

function saveAuth(authData) {
  localStorage.setItem("bq-auth", JSON.stringify(authData));
}

// =========================
// Login modal & backend auth
// =========================

loginToggleBtn.addEventListener("click", openLoginModal);
closeLoginBtn.addEventListener("click", closeLoginModal);

loginModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    closeLoginModal();
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value; // don’t trim password

  if (!username || !password) return;

  const endpoint =
    authMode === "login" ? "/api/auth/login" : "/api/auth/signup";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(
        errData.error ||
          `There was a problem trying to ${
            authMode === "login" ? "log in" : "sign up"
          }. Please try again.`
      );
      return;
    }

    const data = await res.json();
    // { token, user: { id, username, bestScore } }
    saveAuth(data);
    loadUserFromStorage();
    closeLoginModal();
  } catch (err) {
    console.error("Auth error:", err);
    alert("Network error during authentication.");
  }
});


function openLoginModal() {
  loginModal.classList.remove("hidden");
  usernameInput.focus();
}

function closeLoginModal() {
  loginModal.classList.add("hidden");
}

function loadUserFromStorage() {
  const stored = getAuth();
  if (stored && stored.user && stored.user.username) {
    const best = stored.user.bestScore || 0;
    welcomeMessage.classList.remove("hidden");
    welcomeMessage.textContent =
      best > 0
        ? `Welcome back, ${stored.user.username}! Your best score so far is ${best}/10.`
        : `Welcome back, ${stored.user.username}! Ready to set a new high score?`;

    loginToggleBtn.textContent = `👤 ${stored.user.username}`;
  } else {
    welcomeMessage.classList.add("hidden");
    welcomeMessage.textContent = "";
    loginToggleBtn.textContent = "👤 Login";
  }
}

authModeToggle.addEventListener("click", () => {
  authMode = authMode === "login" ? "signup" : "login";
  updateAuthModalMode();
});

function updateAuthModalMode() {
  if (authMode === "login") {
    modalTitle.textContent = "Log in to BrainQuest";
    modalText.textContent = "Enter your username and password to continue.";
    authSubmitBtn.textContent = "Log In";
    authModeToggle.innerHTML =
      `Don't have an account? <strong>Sign up</strong>`;
  } else {
    modalTitle.textContent = "Create your BrainQuest account";
    modalText.textContent =
      "Choose a username and password to start tracking your scores.";
    authSubmitBtn.textContent = "Sign Up";
    authModeToggle.innerHTML =
      `Already have an account? <strong>Log in</strong>`;
  }
}

function openLoginModal() {
  loginModal.classList.remove("hidden");
  updateAuthModalMode();
  usernameInput.focus();
}


// =========================
// Submit score to backend
// =========================

async function submitScoreToServer({ category, score, totalQuestions, accuracy }) {
  try {
    const auth = getAuth();
    if (!auth || !auth.token) return;

    const res = await fetch("/api/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ category, score, totalQuestions, accuracy }),
    });

    if (!res.ok) {
      console.warn("Failed to save score on server");
      return;
    }

    const data = await res.json();
    if (data.bestScore != null) {
      // Update local bestScore copy
      const updatedAuth = {
        ...auth,
        user: {
          ...auth.user,
          bestScore: data.bestScore,
        },
      };
      saveAuth(updatedAuth);
      loadUserFromStorage();
    }
  } catch (err) {
    console.error("Error submitting score:", err);
  }
}

// =========================
// Dark / Light theme
// =========================

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("bq-theme", isDark ? "dark" : "light");
  updateThemeToggleLabel();
});

function applySavedTheme() {
  const saved = localStorage.getItem("bq-theme");
  if (saved === "dark") {
    document.body.classList.add("dark-theme");
  }
  updateThemeToggleLabel();
}

function updateThemeToggleLabel() {
  const isDark = document.body.classList.contains("dark-theme");
  themeToggleBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}
