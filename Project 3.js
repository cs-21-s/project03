Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

Handlebars.registerHelper('divide', function(a, b) {
    return a / b;
});

Handlebars.registerHelper('gte', function(a, b) {
    return a >= b;
});

let state = {
    username: '',
    currentQuiz: null,
    currentQuestionIndex: 0,
    score: 0,
    startTime: null,
    questions: [],
    quizType: ''
};

const quizTemplate = Handlebars.compile(document.getElementById('quiz-template').innerHTML);
const endTemplate = Handlebars.compile(document.getElementById('end-template').innerHTML);

async function fetchQuizData(quizId) {
        const response = await fetch(`https://my-json-server.typicode.com/cs-21-s/quizdata/db`);
        const data = await response.json();
        return data[quizId];
}

async function loadQuiz(quizId) {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('Please enter your name before starting.');
        return;
    }

    state = {
        username: username,
        currentQuiz: quizId,
        currentQuestionIndex: 0,
        score: 0,
        startTime: new Date(),
        questions: [],
        quizType: quizId
    };

    const questions = await fetchQuizData(quizId);
    state.questions = questions;

    document.getElementById('start-page').style.display = 'none';
    displayCurrentQuestion();
}

function displayCurrentQuestion() {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const app = document.getElementById('app');

    const templateData = {
        title: state.quizType === 'quiz_1' ? 'Java Quiz' : 'Python Quiz',
        questionNumber: state.currentQuestionIndex + 1,
        totalQuestions: state.questions.length,
        currentQuestion: {
            question: currentQuestion.question,
            options: currentQuestion.type === 'image-selection' 
                ? currentQuestion.options.map(url => ({ isImage: true, url }))
                : currentQuestion.options,
            type: currentQuestion.type
        }
    };

    app.innerHTML = quizTemplate(templateData);

    updateTimer();
    updateScore();
}

function checkAnswer(answer) {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    let isCorrect = false;
    let feedbackMessage = '';

    if (currentQuestion.type === 'multiple-choice') {
        isCorrect = currentQuestion.options[currentQuestion.answer] === answer;
    } else if (currentQuestion.type === 'image-selection') {
        isCorrect = parseInt(answer) === currentQuestion.answer;
    } else {
        isCorrect = answer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
    }

    if (isCorrect) {
        state.score++;
        feedbackMessage = 'Correct, Good Job!';
    } else {
        feedbackMessage = `Incorrect. The correct answer is: ${currentQuestion.options[currentQuestion.answer]}.`;
        feedbackMessage += ` Explanation: ${currentQuestion.explanation}`;
    }

    showFeedback(feedbackMessage, isCorrect);
}

function showFeedback(message, isCorrect) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;

    if (isCorrect) {
        setTimeout(() => {
            advanceQuestion();
        }, 1000);
    } else {
        const gotItBtn = document.createElement('button');
        gotItBtn.textContent = 'Got it';
        gotItBtn.className = 'btn btn-primary mt-3';
        gotItBtn.onclick = advanceQuestion;
        feedback.appendChild(gotItBtn);
    }
}

function advanceQuestion() {
    state.currentQuestionIndex++;
    if (state.currentQuestionIndex >= state.questions.length) {
        endQuiz();
    } else {
        displayCurrentQuestion();
    }
}

function endQuiz() {
    const endTime = new Date();
    const timeElapsed = Math.floor((endTime - state.startTime) / 1000);
    const percentage = (state.score / state.questions.length) * 100;
    
    const templateData = {
        username: state.username,
        message: percentage >= 80 ? 'Congratulations' : 'Sorry',
        score: state.score,
        totalQuestions: state.questions.length,
        elapsedTime: timeElapsed
    };

    const app = document.getElementById('app');
    app.innerHTML = endTemplate(templateData);

    document.getElementById('return-home-button').onclick = returnToHome;

    document.getElementById('retake-quiz-button').onclick = function() {
        loadQuiz(state.quizType);
    };
}

function returnToHome() {
    document.getElementById('start-page').style.display = 'block';
    document.getElementById('app').innerHTML = '';
    document.getElementById('username').value = '';
}

function updateTimer() {
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer';
    timerDisplay.className = 'timer';
    document.getElementById('app').appendChild(timerDisplay);

    setInterval(() => {
        if (state.startTime) {
            const currentTime = new Date();
            const elapsedSeconds = Math.floor((currentTime - state.startTime) / 1000);
            timerDisplay.textContent = `Time: ${elapsedSeconds} seconds`;
        }
    }, 1000);
}

function updateScore() {
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score';
    scoreDisplay.className = 'score';
    scoreDisplay.textContent = `Score: ${state.score}/${state.questions.length}`;
    document.getElementById('app').appendChild(scoreDisplay);
}
