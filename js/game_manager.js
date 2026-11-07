function GameManager(size, InputManager, Actuator, StorageManager, random) {
  this.size = size;
  this.inputManager = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator = new Actuator;
  this.random = random || Math.random;
  this.startTiles = 2;
  this.history = [];
  this.dailyChallenge = false;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.setup();
}

GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.history = [];
  this.actuator.continueGame();
  this.setup();
};

GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame();
};

GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying);
};

GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();
  if (previousState && previousState.grid && previousState.grid.size === this.size) {
    this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
    this.score = previousState.score;
    this.over = previousState.over;
    this.won = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else {
    this.grid = new Grid(this.size);
    this.score = 0;
    this.over = false;
    this.won = false;
    this.keepPlaying = false;
    this.addStartTiles();
  }
  this.actuate();
};

GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) this.addRandomTile();
};

GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = this.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(this.random), value);
    this.grid.insertTile(tile);
  }
};

GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) this.storageManager.setBestScore(this.score);
  if (this.over) this.storageManager.clearGameState();
  else this.storageManager.setGameState(this.serialize());
  this.actuator.actuate(this.grid, {
    score: this.score, over: this.over, won: this.won,
    bestScore: this.storageManager.getBestScore(),
    terminated: this.isGameTerminated(), size: this.size
  });
};

GameManager.prototype.serialize = function () {
  return { grid: this.grid.serialize(), score: this.score, over: this.over, won: this.won, keepPlaying: this.keepPlaying };
};

GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) { tile.mergedFrom = null; tile.savePosition(); }
  });
};

GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

GameManager.prototype.move = function (direction) {
  var self = this;
  if (this.isGameTerminated()) return;
  var before = this.serialize();
  var cell, tile;
  var vector = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved = false;
  this.prepareTiles();

  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);
      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next = self.grid.cellContent(positions.next);
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];
          self.grid.insertTile(merged);
          self.grid.removeTile(tile);
          tile.updatePosition(positions.next);
          self.score += merged.value;
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }
        if (!self.positionsEqual(cell, tile)) moved = true;
      }
    });
  });

  if (moved) {
    this.history.push(before);
    if (this.history.length > 30) this.history.shift();
    this.addRandomTile();
    if (!this.movesAvailable()) this.over = true;
    this.actuate();
  }
};

GameManager.prototype.undo = function () {
  if (!this.history.length) return false;
  var state = this.history.pop();
  this.grid = new Grid(state.grid.size, state.grid.cells);
  this.score = state.score;
  this.over = state.over;
  this.won = state.won;
  this.keepPlaying = state.keepPlaying;
  this.storageManager.setGameState(this.serialize());
  this.actuator.continueGame();
  this.actuate();
  return true;
};

GameManager.prototype.setBoardSize = function (size) {
  size = parseInt(size, 10);
  if ([4, 5, 6].indexOf(size) === -1) return;
  this.size = size;
  this.history = [];
  this.storageManager.clearGameState();
  this.actuator.continueGame();
  this.setup();
};

GameManager.prototype.startDailyChallenge = function () {
  var date = new Date();
  var seedText = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  var seed = 0;
  for (var i = 0; i < seedText.length; i++) seed = ((seed << 5) - seed + seedText.charCodeAt(i)) | 0;
  this.random = function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  this.dailyChallenge = true;
  this.size = 4;
  this.history = [];
  this.storageManager.clearGameState();
  this.actuator.continueGame();
  this.setup();
};

GameManager.prototype.getHint = function () {
  var directions = [0, 1, 2, 3];
  for (var d = 0; d < directions.length; d++) {
    var vector = this.getVector(directions[d]);
    var traversals = this.buildTraversals(vector);
    var found = false;
    for (var xi = 0; xi < traversals.x.length && !found; xi++) {
      for (var yi = 0; yi < traversals.y.length && !found; yi++) {
        var cell = { x: traversals.x[xi], y: traversals.y[yi] };
        var tile = this.grid.cellContent(cell);
        if (tile) {
          var far = this.findFarthestPosition(cell, vector);
          var next = this.grid.cellContent(far.next);
          if (!this.positionsEqual(cell, far.farthest) || (next && next.value === tile.value)) found = true;
        }
      }
    }
    if (found) return directions[d];
  }
  return null;
};

GameManager.prototype.getVector = function (direction) {
  return { 0: { x: 0, y: -1 }, 1: { x: 1, y: 0 }, 2: { x: 0, y: 1 }, 3: { x: -1, y: 0 } }[direction];
};

GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };
  for (var pos = 0; pos < this.size; pos++) { traversals.x.push(pos); traversals.y.push(pos); }
  if (vector.x === 1) traversals.x.reverse();
  if (vector.y === 1) traversals.y.reverse();
  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;
  do {
    previous = cell;
    cell = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));
  return { farthest: previous, next: cell };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

GameManager.prototype.tileMatchesAvailable = function () {
  var self = this, tile;
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });
      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var other = self.grid.cellContent({ x: x + vector.x, y: y + vector.y });
          if (other && other.value === tile.value) return true;
        }
      }
    }
  }
  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};