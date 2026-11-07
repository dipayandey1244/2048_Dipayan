// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  window.fluxGame = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  if (window.FluxFeatures) window.FluxFeatures.init(window.fluxGame);
});