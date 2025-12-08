# QuizApp

A full-stack, interactive quiz application built with vanilla JavaScript, Node.js, Express, and MongoDB. Test your knowledge with 10 random questions, track your scores, and compete on the leaderboard!

🔗 **Live Demo:** [https://quiz-app-vkzf.vercel.app/](https://quiz-app-vkzf.vercel.app/)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Team Members](#team-members)
- [Screenshots](#screenshots)

---

## ✨ Features

### Core Features
- **🎯 Quiz Gameplay**: Take a 10-question quiz with multiple-choice answers
- **⏱️ Timer Challenge**: 20-second countdown for each question
- **📊 Score Tracking**: Real-time score updates and detailed results review
- **🏆 Leaderboard**: View top 10 scores across all players
- **👤 User Authentication**: Signup/login system with JWT tokens
- **📈 Personal Score History**: Track your performance over time
- **🌗 Dark Mode**: Toggle between light and dark themes

### Quiz Modes
1. **Random BrainQuest**: 10 random questions from local JSON database
2. **Subject Mode (API)**: Choose category and difficulty using the Open Trivia Database API
   - 23+ categories (General Knowledge, Science, History, Sports, etc.)
   - 3 difficulty levels (Easy, Medium, Hard)

### Additional Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Animated UI**: Smooth transitions and interactive elements
- **Results Review**: See which questions you got right/wrong after completion
- **Session Persistence**: Stay logged in across browser sessions
- **MongoDB Integration**: Secure storage of user data and scores

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom animations, gradients, and responsive design
- **JavaScript (ES6+)** - Vanilla JS for DOM manipulation and API calls

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### Authentication & Security
- **bcryptjs** - Password hashing
- **jsonwebtoken (JWT)** - Token-based authentication
- **dotenv** - Environment variable management

### External APIs
- **Open Trivia Database API** - Quiz questions for Subject Mode

### Deployment
- **Vercel** - Serverless deployment platform

---

## 📁 Project Structure

```
QuizApp/
├── models/
│   ├── user.js              # User schema (username, passwordHash, bestScore)
│   └── score.js             # Score schema (user, category, score, accuracy)
├── routes/
│   ├── auth.js              # Authentication routes (signup, login)
│   └── scores.js            # Score routes (save, retrieve, leaderboard)
├── index.html               # Main HTML file
├── style.css                # Stylesheet with dark mode support
├── script.js                # Client-side JavaScript
├── server.js                # Express server & API endpoints
├── questions.json           # Local question database (800+ questions)
├── package.json             # Dependencies and scripts
├── vercel.json              # Vercel deployment configuration
├── .env                     # Environment variables (not committed)
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Philippe-Je/QuizApp.git
   cd QuizApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/quizapp
   JWT_SECRET=your_secret_key_here
   PORT=3000
   ```

   For production (MongoDB Atlas):
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quizapp?retryWrites=true&w=majority
   JWT_SECRET=your_super_secure_secret_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:3000`

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/quizapp` |
| `JWT_SECRET` | Secret key for JWT token signing | `my_super_secret_key_2024` |
| `PORT` | Server port (optional, defaults to 3000) | `3000` |

---

## 📡 API Endpoints

### Authentication

#### `POST /api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "bestScore": 0
  }
}
```

#### `POST /api/auth/login`
Log in to existing account.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "bestScore": 8
  }
}
```

---

### Questions

#### `GET /api/questions`
Fetch quiz questions (local or API).

**Query Parameters:**
- `source` - `"local"` or `"api"` (default: `"api"`)
- `amount` - Number of questions (default: `10`)
- `category` - OpenTDB category ID (only for API mode)
- `difficulty` - `"easy"`, `"medium"`, or `"hard"` (only for API mode)
- `type` - `"multiple"` (default)

**Example Request:**
```
GET /api/questions?source=api&amount=10&category=21&difficulty=medium&type=multiple
```

**Response:**
```json
[
  {
    "question": "What is the capital of France?",
    "A": "London",
    "B": "Berlin",
    "C": "Paris",
    "D": "Madrid",
    "answer": "C"
  },
  ...
]
```

---

### Scores

#### `POST /api/scores`
Save a quiz score (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "category": "random",
  "score": 8,
  "totalQuestions": 10,
  "accuracy": 80
}
```

**Response:**
```json
{
  "message": "Score saved.",
  "bestScore": 8,
  "score": {
    "id": "507f1f77bcf86cd799439011",
    "category": "random",
    "score": 8,
    "totalQuestions": 10,
    "accuracy": 80,
    "createdAt": "2024-12-08T05:30:00.000Z"
  }
}
```

#### `GET /api/scores/me`
Get current user's score history (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `category` - Filter by category (optional)

**Example Request:**
```
GET /api/scores/me?category=random
```

**Response:**
```json
{
  "scores": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "category": "random",
      "score": 8,
      "totalQuestions": 10,
      "accuracy": 80,
      "createdAt": "2024-12-08T05:30:00.000Z"
    },
    ...
  ]
}
```

#### `GET /api/scores/leaderboard`
Get top scores across all users.

**Query Parameters:**
- `category` - Filter by category (optional)
- `limit` - Number of results (default: `10`)

**Example Request:**
```
GET /api/scores/leaderboard?category=random&limit=10
```

**Response:**
```json
{
  "scores": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": {
        "_id": "507f191e810c19729de860ea",
        "username": "johndoe"
      },
      "category": "random",
      "score": 10,
      "totalQuestions": 10,
      "accuracy": 100,
      "createdAt": "2024-12-08T05:30:00.000Z"
    },
    ...
  ]
}
```

---

## 🚢 Deployment

This project is deployed on **Vercel**.

### Deploy Your Own

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   
   In Vercel dashboard → Settings → Environment Variables, add:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Your secret key

4. **Deploy**
   
   Vercel will automatically deploy on every push to `main` branch.

### Vercel Configuration

The `vercel.json` file configures routing:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/style.css",
      "dest": "/style.css"
    },
    {
      "src": "/script.js",
      "dest": "/script.js"
    },
    {
      "src": "/questions.json",
      "dest": "/questions.json"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 👥 Team Members

This project was developed as part of a solo project assignment.

| Name | Role | Contributions |
|------|------|---------------|
| **Philippe Jean** | Full-Stack Developer | Backend API, MongoDB integration, authentication | 
| **Philippe Jean** | Frontend Developer | UI/UX design, CSS animations, responsive layout |
| **Philippe Jean** | Feature Developer | Quiz logic, timer functionality, scoring system |

---

## 📸 Screenshots

### Home Screen
![Home Screen](https://via.placeholder.com/800x450.png?text=Home+Screen)

### Quiz Gameplay
![Quiz Question](https://via.placeholder.com/800x450.png?text=Quiz+Question)

### Results Screen
![Results](https://via.placeholder.com/800x450.png?text=Results+Screen)

### Leaderboard
![Leaderboard](https://via.placeholder.com/800x450.png?text=Leaderboard)

### Dark Mode
![Dark Mode](https://via.placeholder.com/800x450.png?text=Dark+Mode)

---

## 🎮 How to Play

1. **Choose Your Mode**
   - **Random BrainQuest**: Jump straight into 10 random questions
   - **Subject Mode**: Pick a category and difficulty level

2. **Answer Questions**
   - Read the question carefully
   - You have 20 seconds per question
   - Click your answer choice
   - Get instant feedback (correct/incorrect)

3. **View Results**
   - See your final score
   - Review all questions and correct answers
   - Check your accuracy percentage

4. **Track Progress**
   - Sign up/login to save your scores
   - View your personal score history
   - Compete on the global leaderboard

---

## 🔧 Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

---

## 📦 Dependencies

### Production
```json
{
  "bcryptjs": "^3.0.3",
  "dotenv": "^17.2.3",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.0.1"
}
```

### Development
```json
{
  "nodemon": "^3.1.11"
}
```

---

## 🐛 Known Issues

- None at this time! Report issues on GitHub.

---

## 🚀 Future Enhancements

- [ ] Add difficulty levels for local questions
- [ ] Implement timed quiz mode (complete all 10 questions in X minutes)
- [ ] Add multiplayer mode
- [ ] Social features (friend challenges, share scores)
- [ ] More quiz categories
- [ ] Achievement badges
- [ ] Profile customization
- [ ] Statistics dashboard (average score, categories played, etc.)

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- [Open Trivia Database](https://opentdb.com/) for providing free quiz questions
- [Vercel](https://vercel.com) for hosting
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database hosting
- Course instructors and TAs for project guidance

---

## 📞 Contact

For questions or feedback, please reach out:

- **GitHub**: [Philippe-Je](https://github.com/Philippe-Je)
- **Email**: your.email@example.com

---

**⭐ If you found this project helpful, please give it a star on GitHub!**
