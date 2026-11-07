// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var savedSize = 4;
  try { savedSize = parseInt(window.localStorage.getItem("flux-board-size") || "4", 10); } catch (error) {}
  if ([4, 5, 6].indexOf(savedSize) === -1) savedSize = 4;
  window.fluxGame = new GameManager(savedSize, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  if (window.FluxFeatures) window.FluxFeatures.init(window.fluxGame);
});