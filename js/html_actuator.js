function HTMLActuator() {
  this.tileContainer = document.querySelector(".tile-container");
  this.gridContainer = document.querySelector(".grid-container");
  this.scoreContainer = document.querySelector(".score-container");
  this.bestContainer = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.score = 0;
  this.cellSize = 0;
  this.gap = 0;
  this.offset = 12;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;
  window.requestAnimationFrame(function () {
    self.renderGrid(grid.size);
    self.clearContainer(self.tileContainer);
    grid.cells.forEach(function (column) {
      column.forEach(function (cell) { if (cell) self.addTile(cell); });
    });
    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);
    if (metadata.terminated) {
      if (metadata.over) self.message(false);
      else if (metadata.won) self.message(true);
    }
    if (window.FluxFeatures) window.FluxFeatures.onGameUpdate(metadata, grid);
  });
};

HTMLActuator.prototype.renderGrid = function (size) {
  var board = document.querySelector(".game-container");
  var width = board.clientWidth - this.offset * 2;
  this.gap = size >= 6 ? 6 : (size === 5 ? 8 : 10);
  this.cellSize = (width - this.gap * (size - 1)) / size;
  this.gridContainer.innerHTML = "";
  this.gridContainer.style.cssText = "position:absolute;left:"+this.offset+"px;top:"+this.offset+"px;width:"+width+"px;height:"+width+"px;display:grid;grid-template-columns:repeat("+size+",1fr);grid-template-rows:repeat("+size+",1fr);gap:"+this.gap+"px;";
  for (var i = 0; i < size * size; i++) {
    var cell = document.createElement("div");
    cell.className = "grid-cell";
    this.gridContainer.appendChild(cell);
  }
  this.tileContainer.style.cssText = "position:absolute;left:"+this.offset+"px;top:"+this.offset+"px;width:"+width+"px;height:"+width+"px;";
  board.setAttribute("data-size", size);
};

HTMLActuator.prototype.continueGame = function () { this.clearMessage(); };

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) container.removeChild(container.firstChild);
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;
  var wrapper = document.createElement("div");
  var inner = document.createElement("div");
  var position = tile.previousPosition || { x: tile.x, y: tile.y };
  var classes = ["tile", "tile-" + tile.value, this.positionClass(position)];
  if (tile.value > 2048) classes.push("tile-super");
  this.applyClasses(wrapper, classes);
  var size = this.cellSize;
  inner.className = "tile-inner";
  inner.textContent = tile.value;
  wrapper.style.width = size + "px";
  wrapper.style.height = size + "px";
  inner.style.width = size + "px";
  inner.style.height = size + "px";
  inner.style.lineHeight = size + "px";
  inner.style.fontSize = Math.max(15, Math.min(52, size * (tile.value >= 1024 ? 0.27 : tile.value >= 128 ? 0.34 : 0.45))) + "px";
  wrapper.style.transform = this.tileTransform(position);
  if (tile.previousPosition) {
    window.requestAnimationFrame(function () {
      wrapper.style.transform = self.tileTransform({ x: tile.x, y: tile.y });
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);
    tile.mergedFrom.forEach(function (merged) { self.addTile(merged); });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }
  wrapper.appendChild(inner);
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.tileTransform = function (position) {
  return "translate(" + (position.x * (this.cellSize + this.gap)) + "px," + (position.y * (this.cellSize + this.gap)) + "px)";
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);
  var difference = score - this.score;
  this.score = score;
  this.scoreContainer.textContent = this.score;
  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;
    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";
  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};