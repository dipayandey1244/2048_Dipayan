const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({ Math, JSON });
["js/tile.js", "js/grid.js", "js/game_manager.js"].forEach((file) => {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  vm.runInContext(source, context, { filename: file });
});

const { GameManager, Grid, Tile } = context;

function createManager(size = 4, randomValues = [], emptyBoard = true) {
  let randomIndex = 0;
  const random = () => {
    const value = randomValues[randomIndex];
    randomIndex += 1;
    return value === undefined ? 0 : value;
  };
  const storage = {
    state: null,
    best: 0,
    getGameState() { return this.state; },
    setGameState(state) { this.state = state; },
    clearGameState() { this.state = null; },
    getBestScore() { return this.best; },
    setBestScore(score) { this.best = score; }
  };
  const actuator = {
    metadata: null,
    actuate(grid, metadata) { this.metadata = metadata; },
    continueGame() {}
  };
  function InputManager() { this.handlers = {}; }
  InputManager.prototype.on = function (event, callback) {
    this.handlers[event] = callback;
  };
  function Actuator() { return actuator; }
  function StorageManager() { return storage; }

  const manager = new GameManager(
    size, InputManager, Actuator, StorageManager, random
  );
  if (emptyBoard) {
    manager.grid = new Grid(size);
    manager.score = 0;
    manager.over = false;
    manager.won = false;
    manager.keepPlaying = false;
  }
  return { manager, storage, actuator };
}

function place(manager, entries) {
  entries.forEach(([x, y, value]) => {
    manager.grid.insertTile(new Tile({ x, y }, value));
  });
}

function values(manager) {
  return JSON.parse(JSON.stringify(manager.grid.cells.map((column) =>
    column.map((tile) => tile ? tile.value : 0)
  )));
}

function rowValues(manager, y = 0) {
  return manager.grid.cells.map((column) =>
    column[y] ? column[y].value : 0
  );
}

test("new game starts with two tiles and deterministic values", () => {
  const { manager } = createManager(4, [0.95, 0, 0, 0], false);
  const occupied = manager.grid.availableCells().length;
  assert.equal(occupied, 14);
  const tiles = [];
  manager.grid.eachCell((x, y, tile) => { if (tile) tiles.push(tile.value); });
  assert.deepEqual(tiles, [4, 2]);
});

test("left move combines equal adjacent tiles and scores the merge", () => {
  const { manager } = createManager(4, [0, 0]);
  place(manager, [[0, 0, 2], [1, 0, 2], [2, 0, 2]]);
  manager.move(3);
  assert.deepEqual(rowValues(manager), [4, 2, 0, 0]);
  assert.equal(manager.score, 4);
});

test("a newly merged tile cannot merge twice in one move", () => {
  const { manager } = createManager(4, [0, 0]);
  place(manager, [[0, 0, 2], [1, 0, 2], [2, 0, 4]]);
  manager.move(3);
  assert.deepEqual(rowValues(manager), [4, 4, 0, 0]);
  assert.equal(manager.score, 4);
});

test("tiles move in each of the four directions", () => {
  const cases = [
    { direction: 0, start: [1, 2], expected: [1, 0] },
    { direction: 1, start: [1, 1], expected: [3, 1] },
    { direction: 2, start: [2, 1], expected: [2, 3] },
    { direction: 3, start: [2, 1], expected: [0, 1] }
  ];
  cases.forEach(({ direction, start, expected }) => {
    const { manager } = createManager(4, [0, 0]);
    place(manager, [[start[0], start[1], 8]]);
    manager.move(direction);
    const tile = manager.grid.cellContent({ x: expected[0], y: expected[1] });
    assert.ok(tile && tile.value === 8);
  });
});

test("an invalid move does not spawn a tile or change the score", () => {
  const { manager, actuator } = createManager(4, [0, 0]);
  place(manager, [[0, 0, 2]]);
  const before = values(manager);
  const metadata = actuator.metadata;
  manager.move(3);
  assert.deepEqual(values(manager), before);
  assert.equal(manager.score, 0);
  assert.equal(actuator.metadata, metadata);
});

test("a merge to 2048 marks the game as won", () => {
  const { manager } = createManager(4, [0, 0]);
  place(manager, [[0, 0, 1024], [1, 0, 1024]]);
  manager.move(3);
  assert.equal(manager.won, true);
  assert.equal(manager.score, 2048);
});

test("a full board with no adjacent matches is game over", () => {
  const { manager } = createManager(4, [0, 0]);
  const pattern = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2]
  ];
  pattern.forEach((row, y) => row.forEach((value, x) => {
    manager.grid.insertTile(new Tile({ x, y }, value));
  }));
  assert.equal(manager.movesAvailable(), false);
  manager.storageManager.setGameState(manager.serialize());
  manager.over = true;
  manager.actuate();
  assert.equal(manager.storageManager.getGameState(), null);
  assert.equal(manager.over, true);
});

test("game state serialization preserves grid, score and terminal flags", () => {
  const { manager } = createManager(4, [0, 0]);
  place(manager, [[1, 2, 16]]);
  manager.score = 48;
  manager.keepPlaying = true;
  const snapshot = manager.serialize();
  assert.equal(snapshot.grid.cells[1][2].value, 16);
  assert.equal(snapshot.score, 48);
  assert.equal(snapshot.keepPlaying, true);
});
