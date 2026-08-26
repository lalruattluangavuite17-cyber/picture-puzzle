const imageInput = document.getElementById("imageInput");
const puzzleBoard = document.getElementById("puzzle-board");
const shuffleButton = document.getElementById("shuffleButton");
const resetButton = document.getElementById("resetButton");
const timerDisplay = document.getElementById("timer");
const movesDisplay = document.getElementById("moves");
const message = document.getElementById("message");
const undoButton =
    document.getElementById("undoButton");
    let moveHistory = [];

const difficulty = document.getElementById("difficulty");
const referenceImage =
    document.getElementById("reference-image");

    const imagePreview =
    document.getElementById("image-preview");

    const previewImage =
    document.getElementById("preview-image");

    const closePreview =
    document.getElementById("close-preview");

    // ==========================
    // IMAGE PREVIEW
    // ==========================

    referenceImage.addEventListener("click", function () {

    if (!originalImage) return;

    previewImage.src = originalImage;

    imagePreview.style.display = "flex";

    });

    closePreview.addEventListener("click", function () {

    imagePreview.style.display = "none";

    });

    imagePreview.addEventListener("click", function (event) {

    if (event.target === imagePreview) {

        imagePreview.style.display = "none";

    }

    });

const soundButton = document.getElementById("soundButton");

const pauseButton =
    document.getElementById("pauseButton");

const resumeButton =
    document.getElementById("resumeButton");

const pauseOverlay =
    document.getElementById("pauseOverlay");

    // ==========================
// ⏸️ PAUSE SYSTEM
// ==========================

let isPaused = false;


pauseButton.addEventListener("click", function () {

    if (!originalImage) return;

    if (!gameStarted) return;

    if (isMoving) return;

    isPaused = true;

    clearInterval(timer);

    pauseOverlay.style.display = "flex";

});


resumeButton.addEventListener("click", function () {

    isPaused = false;

    pauseOverlay.style.display = "none";

    if (gameStarted) {

        startTimer();

    }

});


// ==========================
// GAME SETTINGS
// ==========================

let SIZE = 4;
let TOTAL_TILES = SIZE * SIZE;
let EMPTY_TILE = TOTAL_TILES - 1;

const HINT_COST = 100;


// ==========================
// GAME VARIABLES
// ==========================

let tiles = [];
let originalImage = null;

let moves = 0;
let seconds = 0;
let hintsUsed = 0;

let timer = null;
let gameStarted = false;
let isMoving = false;

let soundEnabled = true;


// ==========================
// SOUND SYSTEM
// ==========================

const audioContext =
    new (window.AudioContext || window.webkitAudioContext)();


function playSound(frequency, duration, type = "sine") {

    if (!soundEnabled) {
        return;
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );

    gain.gain.setValueAtTime(
        0.12,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + duration
    );
}


// ==========================
// CHOOSE IMAGE
// ==========================

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {

        originalImage = event.target.result;

        referenceImage.src = originalImage;

        resetGame();

        message.innerHTML = `
            <h2>🧩 Picture loaded!</h2>
            <p>Tap a piece next to the empty space.</p>
        `;
    };

    reader.readAsDataURL(file);
});


// ==========================
// DIFFICULTY
// ==========================

difficulty.addEventListener("change", function () {

    SIZE = Number(this.value);

    TOTAL_TILES = SIZE * SIZE;

    EMPTY_TILE = TOTAL_TILES - 1;

    puzzleBoard.style.gridTemplateColumns =
        `repeat(${SIZE}, 1fr)`;

    isMoving = false;

    resetGame();
});


// ==========================
// CREATE PUZZLE
// ==========================

function createPuzzle() {

    tiles = [];

    for (let i = 0; i < TOTAL_TILES; i++) {
        tiles.push(i);
    }

    shuffleTiles();

    drawPuzzle();
}


// ==========================
// DRAW PUZZLE
// ==========================

function drawPuzzle() {

    puzzleBoard.innerHTML = "";

    tiles.forEach((tileNumber, index) => {

        const tile =
            document.createElement("button");

        tile.classList.add("puzzle-piece");


        // EMPTY TILE

        if (tileNumber === EMPTY_TILE) {

            tile.style.backgroundImage = "none";

            tile.style.backgroundColor =
                "rgba(0, 0, 0, 0.35)";

            tile.style.cursor = "default";

            tile.style.boxShadow =
                "inset 0 0 15px rgba(0, 0, 0, 0.5)";
        }


        // NORMAL TILE

        else {

            const row =
                Math.floor(tileNumber / SIZE);

            const column =
                tileNumber % SIZE;


            const x =
                (column / (SIZE - 1)) * 100;

            const y =
                (row / (SIZE - 1)) * 100;


            tile.style.backgroundImage =
                `url("${originalImage}")`;

            tile.style.backgroundPosition =
                `${x}% ${y}%`;

            tile.style.backgroundSize =
                `${SIZE * 100}% ${SIZE * 100}%`;


            tile.addEventListener("click", function () {

                moveTile(index);

            });
        }


        puzzleBoard.appendChild(tile);

    });
}


// ==========================
// SHUFFLE
// ==========================

function shuffleTiles() {

    do {

        for (let i = tiles.length - 1; i > 0; i--) {

            const randomIndex =
                Math.floor(Math.random() * (i + 1));

            [tiles[i], tiles[randomIndex]] =
            [tiles[randomIndex], tiles[i]];
        }

    } while (isSolved());
}


// ==========================
// MOVE TILE
// ==========================

function moveTile(index) {

    if (isPaused) {
        return;
    }

    if (isMoving) {
        return;
    }

    


    const emptyIndex =
        tiles.indexOf(EMPTY_TILE);


    const row =
        Math.floor(index / SIZE);

    const column =
        index % SIZE;


    const emptyRow =
        Math.floor(emptyIndex / SIZE);

    const emptyColumn =
        emptyIndex % SIZE;


    const canMove =

        (
            Math.abs(row - emptyRow) === 1 &&
            column === emptyColumn
        )

        ||

        (
            Math.abs(column - emptyColumn) === 1 &&
            row === emptyRow
        );


    if (!canMove) {
        return;
    }


    isMoving = true;


    // Move sound

    playSound(450, 0.08);


    // Start timer

    if (!gameStarted) {

        startTimer();

        gameStarted = true;
    }


    const pieces =
        puzzleBoard.children;

        // Save current board before moving
    moveHistory.push([...tiles]);

    const movingPiece =
        pieces[index];


    const boardSize =
        puzzleBoard.clientWidth;

    const tileSize =
        boardSize / SIZE;


    const xMove =
        (emptyColumn - column) *
        tileSize;

    const yMove =
        (emptyRow - row) *
        tileSize;


    movingPiece.classList.add("sliding");

    movingPiece.style.transform =
        `translate(${xMove}px, ${yMove}px)`;


    setTimeout(function () {

        [tiles[index], tiles[emptyIndex]] =
        [tiles[emptyIndex], tiles[index]];


        moves++;

        movesDisplay.textContent =
            moves;


        drawPuzzle();


        isMoving = false;


        if (isSolved()) {

            finishGame();

        }

    }, 300);
}


// ==========================
// HINT SYSTEM 💡
// ==========================

function giveHint() {

    if (!originalImage) {

        message.innerHTML = `
            <h2>🖼️ Choose a picture first!</h2>
        `;

        return;
    }


    if (isMoving) {
        return;
    }


    if (isSolved()) {
        return;
    }


    // Find empty space

    const emptyIndex =
        tiles.indexOf(EMPTY_TILE);


    const emptyRow =
        Math.floor(emptyIndex / SIZE);

    const emptyColumn =
        emptyIndex % SIZE;


    // Find tiles next to empty space

    const possibleMoves = [];


    for (let i = 0; i < tiles.length; i++) {

        const row =
            Math.floor(i / SIZE);

        const column =
            i % SIZE;


        const canMove =

            (
                Math.abs(row - emptyRow) === 1 &&
                column === emptyColumn
            )

            ||

            (
                Math.abs(column - emptyColumn) === 1 &&
                row === emptyRow
            );


        if (canMove) {

            possibleMoves.push(i);

        }
    }


    if (possibleMoves.length === 0) {
        return;
    }


    // Pick a random valid tile

    const hintIndex =
        possibleMoves[
            Math.floor(
                Math.random() *
                possibleMoves.length
            )
        ];


    const hintPiece =
        puzzleBoard.children[hintIndex];


    // Highlight it

    hintPiece.classList.add("hint");


    // Cost a hint

    hintsUsed++;


    // Sound

    playSound(700, 0.15);


    message.innerHTML = `
        <h2>💡 Hint!</h2>
        <p>Try the glowing piece.</p>
        <p>Hint cost: ${HINT_COST} points</p>
    `;


    // Remove highlight after 1.5 seconds

    setTimeout(function () {

        hintPiece.classList.remove("hint");

    }, 1500);
}


// ==========================
// CHECK SOLVED
// ==========================

function isSolved() {

    for (let i = 0; i < TOTAL_TILES; i++) {

        if (tiles[i] !== i) {

            return false;
        }
    }

    return true;
}


// ==========================
// TIMER
// ==========================

function startTimer() {

    clearInterval(timer);

    timer = setInterval(function () {

        seconds++;


        const minutes =
            Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");


        const secs =
            (seconds % 60)
            .toString()
            .padStart(2, "0");


        timerDisplay.textContent =
            `${minutes}:${secs}`;

    }, 1000);
}


// ==========================
// CALCULATE SCORE
// ==========================

function calculateScore() {

    let baseScore;


    if (SIZE === 3) {

        baseScore = 5000;

    }
    else if (SIZE === 4) {

        baseScore = 10000;

    }
    else {

        baseScore = 15000;

    }


    const movePenalty =
        moves * 25;


    const timePenalty =
        seconds * 5;


    const hintPenalty =
        hintsUsed * HINT_COST;


    let score =
        baseScore -
        movePenalty -
        timePenalty -
        hintPenalty;


    if (score < 0) {
        score = 0;
    }


    return score;
}


// ==========================
// RATING
// ==========================

function getRating(score) {

    let maxScore;


    if (SIZE === 3) {

        maxScore = 5000;

    }
    else if (SIZE === 4) {

        maxScore = 10000;

    }
    else {

        maxScore = 15000;

    }


    const percentage =
        (score / maxScore) * 100;


    if (percentage >= 75) {

        return "⭐⭐⭐ Excellent!";

    }
    else if (percentage >= 45) {

        return "⭐⭐ Good Job!";

    }
    else {

        return "⭐ Keep Practicing!";

    }
}


// ==========================
// HIGH SCORE
// ==========================

function getBestScore() {

    const savedScore =
        localStorage.getItem(
            `puzzleBestScore${SIZE}`
        );


    if (savedScore === null) {
        return 0;
    }


    return Number(savedScore);
}


function saveBestScore(score) {

    const bestScore =
        getBestScore();


    if (score > bestScore) {

        localStorage.setItem(
            `puzzleBestScore${SIZE}`,
            score
        );

        return true;
    }


    return false;
}


// ==========================
// FINISH GAME
// ==========================

function finishGame() {

    clearInterval(timer);

    gameStarted = false;

    isMoving = false;


    // Victory melody 🎉

    playSound(523, 0.18);

    setTimeout(function () {
        playSound(659, 0.18);
    }, 180);

    setTimeout(function () {
        playSound(784, 0.25);
    }, 360);

    setTimeout(function () {
        playSound(1047, 0.4);
    }, 620);


    // Score

    const score =
        calculateScore();


    const rating =
        getRating(score);


    // High score

    const newRecord =
        saveBestScore(score);


    const bestScore =
        getBestScore();


    message.innerHTML = `

        <div class="victory">

            <h2>🎉 Puzzle Solved!</h2>

            <h3>🏆 Score: ${score}</h3>

            <h3>${rating}</h3>

            ${
                newRecord
                ? `<h3>🔥 NEW RECORD!</h3>`
                : ""
            }

            <p>🧩 Moves: ${moves}</p>

            <p>⏱️ Time: ${timerDisplay.textContent}</p>

            <p>💡 Hints Used: ${hintsUsed}</p>

            <p>🏆 Best Score: ${bestScore}</p>

            <button
                class="play-again"
                id="playAgain">

                🔄 Play Again

            </button>

        </div>

    `;


    document
        .getElementById("playAgain")
        .addEventListener("click", function () {

            resetGame();


            message.innerHTML = `
                <h2>🧩 New Puzzle!</h2>
                <p>Good luck!</p>
            `;

        });
}


// ==========================
// RESET
// ==========================

function resetGame() {

    clearInterval(timer);

    isPaused = false;

    pauseOverlay.style.display = "none";

    moves = 0;

    seconds = 0;

    hintsUsed = 0;

    gameStarted = false;

    moveHistory = [];

    isMoving = false;


    movesDisplay.textContent =
        "0";

    timerDisplay.textContent =
        "00:00";


    if (originalImage) {

        createPuzzle();

    }
}


// ==========================
// SHUFFLE BUTTON
// ==========================

shuffleButton.addEventListener("click", function () {

    if (!originalImage) {

        message.innerHTML = `
            <h2>🖼️ Choose a picture first!</h2>
        `;

        return;
    }


    clearInterval(timer);

    moves = 0;

    seconds = 0;

    hintsUsed = 0;

    gameStarted = false;

    moveHistory = [];

    isMoving = false;


    movesDisplay.textContent =
        "0";

    timerDisplay.textContent =
        "00:00";


    createPuzzle();

});


// ==========================
// RESET BUTTON
// ==========================

resetButton.addEventListener("click", function () {

    if (!originalImage) {
        return;
    }

    resetGame();

});


// ==========================
// SOUND BUTTON
// ==========================

soundButton.addEventListener("click", function () {

    soundEnabled =
        !soundEnabled;


    if (soundEnabled) {

        soundButton.textContent =
            "🔊 Sound On";

        playSound(600, 0.1);

    }
    else {

        soundButton.textContent =
            "🔇 Sound Off";

    }

});


// ==========================
// HINT BUTTON
// ==========================

const hintButton =
    document.getElementById("hintButton");


hintButton.addEventListener("click", function () {

    giveHint();

});

// ==========================
// IMAGE GALLERY
// ==========================

const galleryButton =
    document.getElementById("galleryButton");

const gallery =
    document.getElementById("gallery");

const galleryItems =
    document.querySelectorAll(".gallery-item");


galleryButton.addEventListener("click", function () {

    if (gallery.style.display === "block") {

        gallery.style.display = "none";

    }
    else {

        gallery.style.display = "block";

    }

});


galleryItems.forEach(function (item) {

    item.addEventListener("click", function () {

        const imagePath =
            this.dataset.image;

        originalImage =
            imagePath;

        referenceImage.src =
            originalImage;

        resetGame();

        gallery.style.display =
            "none";


        message.innerHTML = `
            <h2>🖼️ Picture selected!</h2>
            <p>Good luck solving it!</p>
        `;

    });

});

// ==========================
// ↩️ UNDO
// ==========================

undoButton.addEventListener("click", function () {

    if (!originalImage) return;

    if (isPaused) return;

    if (isMoving) return;

    if (moveHistory.length === 0) {

        message.innerHTML = `
            <h2>↩️ Nothing to undo!</h2>
            <p>Make a move first.</p>
        `;

        return;
    }

    // Get previous board
    tiles = moveHistory.pop();

    // Count the undo as removing a move
    if (moves > 0) {
        moves--;
    }

    movesDisplay.textContent = moves;

    drawPuzzle();

});