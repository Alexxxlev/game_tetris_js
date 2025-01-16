import { 
  PLAYFIELD_COLUMNS,
  PLAYFIELD_ROWS,
  TETROMINO_NAMES,
  TETROMINOES,
  getRandomElement,
  rotateMatrix
} from "./utilities.js";

export class Tetris {
  constructor() {
    this.playfield;
    this.tetromino;
    this.isGameOver = false;
    this.init();
  }

  init() {
    this.generatePlayfield();
    this.generateTetromino();
  }

  // массив для игрового поля (заполнен нулями)
  generatePlayfield() {
    this.playfield = new Array(PLAYFIELD_ROWS)
      .fill()
      .map(() => new Array(PLAYFIELD_COLUMNS).fill(0));
  }

  // достать случайный элемент из массива названий фигурок
  generateTetromino() {
    const name = getRandomElement(TETROMINO_NAMES);
    const matrix = TETROMINOES[name];

    // рассчитать номер колонки с которой должна начать рисоваться фигура
    const column = PLAYFIELD_COLUMNS / 2 - Math.floor(matrix.length / 2);
    const row = -2;

    this.tetromino = {
      name,
      matrix,
      row,
      column,
      ghostColumn: column,
      ghostRow: row,
    };

    this.calculateGhostPosition();
  }

  moveTetrominoDown() {
    this.tetromino.row += 1;
    if (!this.isValid()) {
      this.tetromino.row -= 1;
      this.placeTetromino();
    }
  }

  moveTetrominoLeft() {
    this.tetromino.column -= 1;
    if (!this.isValid()) {
      this.tetromino.column += 1;
    } else {
      this.calculateGhostPosition();
    }
  }

  moveTetrominoRight() {
    this.tetromino.column += 1;
    if (!this.isValid()) {
      this.tetromino.column -= 1;
    } else {
      this.calculateGhostPosition();
    }
  }

  rotateTetromino() {
    // старое расположение матрицы фигуры
    const oldMatrix = this.tetromino.matrix;
    // повернуть матрицу фигурки
    const rotatedMatrix = rotateMatrix(this.tetromino.matrix);
    // перезаписать матрицу фигурки на новую перевернутую
    this.tetromino.matrix = rotatedMatrix;
    if (!this.isValid()) {
      this.tetromino.matrix += oldMatrix;
    } else {
      this.calculateGhostPosition();
    }
  }

  // перемещать фигурку на место призрачной фигурки
  dropTetrominoDown() {
    this.tetromino.row = this.tetromino.ghostRow;
    // сразу размещать фигурку на игровом поле
    this.placeTetromino();
  }

  isValid() {
    const matrixSize = this.tetromino.matrix.length;
    for (let row = 0; row < matrixSize; row++) {
      for (let column = 0; column < matrixSize; column++) {
        //если элемент матрицы 0
        if (!this.tetromino.matrix[row][column]) continue;
        // проверять вышла ли фигурка за пределы игрового поля
        if (this.isOutsideOfGameBoard(row, column)) return false;
        // проверять чтоб падающая фигурка не налезала на уже стоящую фигурку
        if (this.isCollides(row, column)) return false;
      }
    }
    return true;
  }

  isOutsideOfGameBoard(row, column) {
    return (
      this.tetromino.column + column < 0 ||
      this.tetromino.column + column >= PLAYFIELD_COLUMNS ||
      this.tetromino.row + row >= this.playfield.length
    );
  }

  isCollides(row, column) {
    // возвращать элемент поля который расположен там же где и фигурка, если на поле что то уже будет то вернуть строку которая преобразуется в true, если на поле ничего нет то вернуть 0
    return this.playfield[this.tetromino.row + row]?.[
      this.tetromino.column + column
    ];
  }

  // сохранять фигурку в игровое поле
  placeTetromino() {
    const matrixSize = this.tetromino.matrix.length;
    for (let row = 0; row < matrixSize; row++) {
      for (let column = 0; column < matrixSize; column++) {
        // пропустить клетки матрицы с нулями
        if (!this.tetromino.matrix[row][column]) continue;
        // проверять каждый не пустой элемент фигурки не вышел ли он за пределы поля
        if (this.isOutsideOfTopBoard(row)) {
          this.isGameOver = true;
          return;
        }

        // в ячейку поля которая соответствует положению ячейки фигурки сохранить название фигурки
        this.playfield[this.tetromino.row + row][
          this.tetromino.column + column
        ] = this.tetromino.name;
      }
    }

    this.processFilledRows();
    this.generateTetromino();
  }

  // высчитать номер строки элемента фигурки на поле и если номер строки меньше 0 то возвращать true
  isOutsideOfTopBoard(row) {
    return this.tetromino.row + row < 0;
  }

  processFilledRows() {
    // найти все заполненные линии
    const filledLines = this.findFilledRows();
    this.removeFilledRows(filledLines);
  }

  // пробежаться по строкам поля, найти заполненеые строки и в конце возвращать массив с номерами заполненных строк
  findFilledRows() {
    const filledRows = [];
    for (let row = 0; row < PLAYFIELD_ROWS; row++) {
      // если в строке все элементы отличны от нуля, то добавить номер этой строки в массив filledRows
      if (this.playfield[row].every((cell) => Boolean(cell))) {
        filledRows.push(row);
      }
    }

    return filledRows;
  }

  removeFilledRows(filledRows) {
    filledRows.forEach((row) => {
      this.dropRowsAbove(row);
    });
  }

  // принимает номер строки которую нужно удалить
  dropRowsAbove(rowToDelate) {
    // пробежаться по всем строкам от той которую нужно удалить до предпоследней сверху
    for (let row = rowToDelate; row > 0; row--) {
      // менять каждую проверяемую строку на ту что выше неё
      this.playfield[row] = this.playfield[row - 1];
    }
    // самую верхнюю строку заменить пустой строкой
    this.playfield[0] = new Array(PLAYFIELD_COLUMNS).fill(0);
  }

  // призрачная фигурка окончания игры
  calculateGhostPosition() {
    // сохранить положение фигурки по строке
    const tetrominoRow = this.tetromino.row;
    this.tetromino.row++;
    // проверять валидное значение фигурки пока не дойдем до не валидного
    while (this.isValid()) {
      this.tetromino.row++;
    }
    // значение строки для призрачной фигурки = последнему валидному (на 1 меньше)
    this.tetromino.ghostRow = this.tetromino.row - 1;
    this.tetromino.ghostColumn = this.tetromino.column;
    // вернуть основной фигурке прежнее значение строки
    this.tetromino.row = tetrominoRow;
  }
}