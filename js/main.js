const board = document.getElementById("board");
const statusText = document.getElementById("status");
const timerText = document.getElementById("timer");

const monadLogo = "assets/monad.jpg";
const keoneLogo = "assets/keone.jpg";

let cells = Array(9).fill("");
let gameActive = true;
let timeLeft = 60;
let timer;
let isPlayerTurn = true;

window.addEventListener("load", () => {
  if (window.FarcadeSDK) {
    window.FarcadeSDK.singlePlayer.actions.ready();
  }
  startGame();
});

function startGame() {
  createBoard();
  startTimer();
  gameActive = true;
  isPlayerTurn = true;
  statusText.textContent = "Your Turn (Monad)";
  cells = Array(9).fill("");
}

function startTimer() {
  timeLeft = 60;
  timerText.textContent = `Time Left: ${timeLeft}s`;
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timerText.textContent = `Time Left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame("draw");
    }
  }, 1000);
}

function createBoard() {
  board.innerHTML = "";
  cells.forEach((_, i) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.dataset.index = i;
    div.addEventListener("click", handleCellClick);
    board.appendChild(div);
  });
}

function handleCellClick(e) {
  const index = e.target.dataset.index;
  if (!gameActive || !isPlayerTurn || cells[index] !== "") return;

  isPlayerTurn = false;
  cells[index] = "X";
  updateCell(e.target, "X");

  window.FarcadeSDK?.singlePlayer.actions.hapticFeedback();

  if (checkResult()) return;

  setTimeout(() => aiMove(), 500);
}

function aiMove() {
  if (!gameActive) return;
  const empty = cells.map((v, i) => (v === "" ? i : null)).filter((i) => i !== null);

  let chosen;
  if (Math.random() < 0.6) {
    chosen = findBestMove("O") || findBestMove("X") || empty[Math.floor(Math.random() * empty.length)];
  } else {
    chosen = empty[Math.floor(Math.random() * empty.length)];
  }

  if (chosen == null) return;
  cells[chosen] = "O";
  const cell = document.querySelector(`.cell[data-index='${chosen}']`);
  updateCell(cell, "O");

  if (!checkResult()) {
    isPlayerTurn = true;
    statusText.textContent = "Your Turn (Monad)";
  }
}

function findBestMove(player) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of winPatterns) {
    const values = [cells[a], cells[b], cells[c]];
    if (values.filter((v) => v === player).length === 2 && values.includes("")) {
      return [a, b, c][values.indexOf("")];
    }
  }
  return null;
}

function updateCell(cell, player) {
  const img = document.createElement("img");
  img.src = player === "X" ? monadLogo : keoneLogo;
  cell.appendChild(img);
}

function highlightWinningCells(combo) {
  combo.forEach((i) => {
    document.querySelector(`.cell[data-index='${i}']`).classList.add("winning-cell");
  });
}

function getRandomScore(type) {
  if (type === "win") return Math.floor(Math.random() * 31) + 70;
  if (type === "draw") return Math.floor(Math.random() * 31) + 30;
  return Math.floor(Math.random() * 21);
}

function checkResult() {
  const combos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const combo of combos) {
    const [a, b, c] = combo;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      gameActive = false;
      clearInterval(timer);
      highlightWinningCells(combo);
      const winner = cells[a];
      const scoreType = winner === "X" ? "win" : "lose";
      const score = getRandomScore(scoreType);
      statusText.textContent = winner === "X" ? "You Win!" : "AI Wins!";
      window.FarcadeSDK?.singlePlayer.actions.gameOver({ score });
      return true;
    }
  }

  if (!cells.includes("")) {
    gameActive = false;
    clearInterval(timer);
    const score = getRandomScore("draw");
    statusText.textContent = "It's a Draw!";
    window.FarcadeSDK?.singlePlayer.actions.gameOver({ score });
    return true;
  }

  return false;
}

function endGame(type) {
  gameActive = false;
  const score = getRandomScore("draw");
  if (type === "draw") {
    statusText.textContent = "It's a Draw!";
    window.FarcadeSDK?.singlePlayer.actions.gameOver({ score });
  }
}

if (window.FarcadeSDK) {
  window.FarcadeSDK.on("play_again", () => {
    cells = Array(9).fill("");
    gameActive = true;
    isPlayerTurn = true;
    statusText.textContent = "Your Turn (Monad)";
    startGame();
  });

  window.FarcadeSDK.on("toggle_mute", (data) => {
    console.log("Muted:", data.isMuted);
  });
}
