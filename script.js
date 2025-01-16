import { Tetris } from "./tetris.js";
import {
  PLAYFIELD_COLUMNS,
  PLAYFIELD_ROWS,
  SAD,
  convertPositionToIndex,
} from "./utilities.js";

let hammer;
let requestId;
let timeoutId;
const tetris = new Tetris();
// сохранить все div элементы в которых будут рисоваться фигурки
const cells = document.querySelectorAll(".grid>div");

initKeydown();
initTouch();

moveDown();

function initKeydown() {
  document.addEventListener("keydown", onkeydown);
}

function onkeydown(event) {
  switch (event.key) {
    case "ArrowUp":
      rotate();
      break;
    case "ArrowDown":
      moveDown();
      break;
    case "ArrowLeft":
      moveLeft();
      break;
    case "ArrowRight":
      moveRight();
      break;
    case " ":
      dropDown();
      break;

    default:
      break;
  }
}

function initTouch() {
  // отключить двойное нажатие по экрану
  document.addEventListener("dblclick", (event) => {
    event.preventDefault();
  });

  // создать экземляр класса hammer
  hammer = new Hammer(document.querySelector("body"));
  // событие pan должно работать во все стороны
  hammer.get("pan").set({ direction: Hammer.DIRECTION_ALL });
  // событие при быстром перемещении в любую сторону
  hammer.get("swipe").set({ direction: Hammer.DIRECTION_ALL });

  // каждое смещение пальца на 30px будет также смещаться и фигурка
  const threshold = 30;
  // для учета смещения
  let deltaX = 0;
  let deltaY = 0;

  // когда только началось движение пальцем
  hammer.on("panstart", () => {
    deltaX = 0;
    deltaY = 0;
  });

  // при движении пальца влево
  hammer.on("panleft", (event) => {
    if (Math.abs(event.deltaX - deltaX) > threshold) {
      moveLeft();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });

  // при движении пальца вправо
  hammer.on("panright", (event) => {
    if (Math.abs(event.deltaX - deltaX) > threshold) {
      moveRight();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });

  // при движении пальца вниз
  hammer.on("pandown", (event) => {
    if (Math.abs(event.deltaY - deltaY) > threshold) {
      moveDown();
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    }
  });

  // при резком движении пальца вниз
  hammer.on("swipedown", (event) => {
    dropDown();
  });

  // при клике пальцем по экрану
  hammer.on("tap", () => {
    rotate();
  });
}

function moveDown() {
  tetris.moveTetrominoDown();
  draw();
  stopLoop();
  startLoop();

  if (tetris.isGameOver) {
    gameOver();
  }
}
function moveLeft() {
  tetris.moveTetrominoLeft();
  draw();
}
function moveRight() {
  tetris.moveTetrominoRight();
  draw();
}

function rotate() {
  tetris.rotateTetromino();
  draw();
}

function dropDown() {
  tetris.dropTetrominoDown();
  draw();
  stopLoop();
  startLoop();

  // проверка на конец игры
  if (tetris.isGameOver) {
    gameOver();
  }
}

function startLoop() {
  timeoutId = setTimeout(
    () => (requestId = requestAnimationFrame(moveDown)),
    700
  );
}

function stopLoop() {
  cancelAnimationFrame(requestId);
  clearTimeout(timeoutId);
}

// на каждом карде заново рисовать поле с фигурками
function draw() {
  cells.forEach((cell) => cell.removeAttribute("class"));
  drawPlayfield();
  drawTetromino();
  drawGhostTetromino();
}

function drawPlayfield() {
  for (let row = 0; row < PLAYFIELD_ROWS; row++) {
    for (let column = 0; column < PLAYFIELD_COLUMNS; column++) {
      // пропустить пустые элементы
      if (!tetris.playfield[row][column]) continue;
      // сохранить название фигурки чей элемент нашли в поле
      const name = tetris.playfield[row][column];
      // соединить позицию ячейки из поля матрицы в индекс ячейки в списке
      const cellIndex = convertPositionToIndex(row, column);
      // добавить этой ячейке класс название элемента фигурки
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawTetromino() {
  const name = tetris.tetromino.name;
  const tetrominoMatrixSize = tetris.tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (!tetris.tetromino.matrix[row][column]) continue;
      if (tetris.tetromino.row + row < 0) continue;
      // индекс элемента фигуры из матрицы пересчитать в индекс ячейки в списке div элементов
      const cellIndex = convertPositionToIndex(
        tetris.tetromino.row + row,
        tetris.tetromino.column + column
      );
      //добавить ячейке такой же класс как и название фигурки
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawGhostTetromino() {
  const tetrominoMatrixSize = tetris.tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      // пропустить элементы призрачной фигурки которые выходят за границы поля
      if (!tetris.tetromino.matrix[row][column]) continue;
      if (tetris.tetromino.ghostRow + row < 0) continue;
      // индекс ячейки для элемента призрачной фигурки
      const cellIndex = convertPositionToIndex(
        tetris.tetromino.ghostRow + row,
        tetris.tetromino.ghostColumn + column
      );
      cells[cellIndex].classList.add("ghost");
    }
  }
}

// останавливать игру и удалять возможность нажатия клавиш и движения пальца(на мобилках)
function gameOver() {
  stopLoop();
  document.removeEventListener("keydown", onkeydown);
  hammer.off("panstart panleft panright pandown swipedown tap");
  gameOverAnimation();
}

function gameOverAnimation() {
  // найти все заполненные клеточки
  const filledCells = [...cells].filter((cell) => cell.classList.length > 0);
  filledCells.forEach((cell, i) => {
    setTimeout(() => cell.classList.add("hide"), i * 10);
    setTimeout(() => cell.removeAttribute("class"), i * 10 + 500);
  });

  setTimeout(drawSad, filledCells.length * 10 + 1000);
}

// нарисовать грустный смайлик
function drawSad() {
  const TOP_OFFSET = 5;
  for(let row = 0; row < SAD.length; row++) {
    for (let column = 0; column < SAD.length; column++) {
      // пропустить нулевые ячейки
      if (!SAD[row][column]) continue;
      const cellIndex = convertPositionToIndex(TOP_OFFSET + row, column);
      cells[cellIndex].classList.add('sad');
    }
  }
}