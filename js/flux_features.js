(function () {
  var translations = {
    en:{tagline:"A little curiosity. A lot of strategy.",board:"BOARD",language:"LANGUAGE",theme:"THEME",undo:"↶ Undo",hint:"✦ Hint",daily:"☀ Daily challenge",soundOn:"♫ Sound on",soundOff:"♫ Sound off",intro:"Join the numbers and reach the 2048 tile!",newGame:"New game",keepGoing:"Keep going",tryAgain:"Try again",achievements:"Achievements",leaderboard:"Personal leaderboard",howTo:"How to play: Use your arrow keys or swipe to move. Matching tiles merge into one. Reach 2048!",score:"SCORE",best:"BEST",win:"You win!",lost:"Game over!"},
    hi:{tagline:"थोड़ी जिज्ञासा, ढेर सारी रणनीति।",board:"बोर्ड",language:"भाषा",theme:"थीम",undo:"↶ वापस",hint:"✦ संकेत",daily:"☀ दैनिक चुनौती",soundOn:"♫ ध्वनि चालू",soundOff:"♫ ध्वनि बंद",intro:"नंबर जोड़ें और 2048 तक पहुँचें!",newGame:"नया खेल",keepGoing:"जारी रखें",tryAgain:"फिर कोशिश करें",achievements:"उपलब्धियाँ",leaderboard:"व्यक्तिगत स्कोर",howTo:"कैसे खेलें: तीर कुंजियों या स्वाइप से टाइलें चलाएँ। समान टाइलें जुड़ती हैं। 2048 तक पहुँचें!",score:"स्कोर",best:"सर्वश्रेष्ठ",win:"आप जीत गए!",lost:"खेल समाप्त!"},
    bn:{tagline:"একটু কৌতূহল, অনেক কৌশল।",board:"বোর্ড",language:"ভাষা",theme:"থিম",undo:"↶ আগের চাল",hint:"✦ ইঙ্গিত",daily:"☀ দৈনিক চ্যালেঞ্জ",soundOn:"♫ শব্দ চালু",soundOff:"♫ শব্দ বন্ধ",intro:"সংখ্যা মেলান এবং ২০৪৮-এ পৌঁছান!",newGame:"নতুন খেলা",keepGoing:"চালিয়ে যান",tryAgain:"আবার চেষ্টা",achievements:"অর্জন",leaderboard:"ব্যক্তিগত স্কোর",howTo:"খেলার নিয়ম: তীরচিহ্ন বা সোয়াইপ দিয়ে টাইল সরান। একই সংখ্যার টাইল মিলে যায়। ২০৪৮-এ পৌঁছান!",score:"স্কোর",best:"সেরা",win:"আপনি জিতেছেন!",lost:"খেলা শেষ!"},
    es:{tagline:"Un poco de curiosidad. Mucha estrategia.",board:"TABLERO",language:"IDIOMA",theme:"TEMA",undo:"↶ Deshacer",hint:"✦ Pista",daily:"☀ Reto diario",soundOn:"♫ Sonido sí",soundOff:"♫ Sonido no",intro:"¡Une los números y alcanza 2048!",newGame:"Nuevo juego",keepGoing:"Continuar",tryAgain:"Reintentar",achievements:"Logros",leaderboard:"Mejores partidas",howTo:"Cómo jugar: usa las flechas o desliza. Las fichas iguales se combinan. ¡Alcanza 2048!",score:"PUNTOS",best:"RÉCORD",win:"¡Has ganado!",lost:"¡Fin del juego!"},
    fr:{tagline:"Un peu de curiosité. Beaucoup de stratégie.",board:"GRILLE",language:"LANGUE",theme:"THÈME",undo:"↶ Annuler",hint:"✦ Indice",daily:"☀ Défi du jour",soundOn:"♫ Son activé",soundOff:"♫ Son coupé",intro:"Fusionnez les nombres et atteignez 2048 !",newGame:"Nouvelle partie",keepGoing:"Continuer",tryAgain:"Réessayer",achievements:"Succès",leaderboard:"Meilleurs scores",howTo:"Comment jouer : utilisez les flèches ou faites glisser. Les tuiles identiques fusionnent. Atteignez 2048 !",score:"SCORE",best:"RECORD",win:"Vous avez gagné !",lost:"Partie terminée !"},
    ja:{tagline:"好奇心を少し。戦略をたっぷり。",board:"ボード",language:"言語",theme:"テーマ",undo:"↶ 元に戻す",hint:"✦ ヒント",daily:"☀ デイリーチャレンジ",soundOn:"♫ 音あり",soundOff:"♫ 音なし",intro:"数字を合わせて2048を目指そう！",newGame:"新しいゲーム",keepGoing:"続ける",tryAgain:"もう一度",achievements:"実績",leaderboard:"ベストスコア",howTo:"遊び方：矢印キーまたはスワイプで移動。同じ数字を合わせて2048を目指そう！",score:"スコア",best:"ベスト",win:"勝利！",lost:"ゲームオーバー"}
  };
  var game, soundEnabled=false, audioContext=null, lastScore=0, currentLanguage="en";
  function byId(id){return document.getElementById(id);}
  function safeGet(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch(e){return fallback;}}
  function safeSet(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}}
  function formatNumber(value){
    var locale=currentLanguage==="hi"?"hi-IN":currentLanguage==="bn"?"bn-BD":currentLanguage==="ja"?"ja-JP":currentLanguage==="fr"?"fr-FR":currentLanguage==="es"?"es-ES":"en-US";
    try{return new Intl.NumberFormat(locale,{maximumFractionDigits:0}).format(Number(value));}
    catch(error){return String(value);}
  }
  function applyLanguage(code){
    currentLanguage=translations[code]?code:"en";
    var t=translations[currentLanguage]||translations.en;
    document.documentElement.lang=currentLanguage;
    document.querySelectorAll("[data-i18n]").forEach(function(el){var key=el.getAttribute("data-i18n");if(t[key])el.textContent=t[key];});
    document.querySelector(".score-container").setAttribute("data-label",t.score);
    document.querySelector(".best-container").setAttribute("data-label",t.best);
    byId("sound-button").textContent=soundEnabled?t.soundOn:t.soundOff;
    safeSet("flux-language",code);
  }
  function renderLists(){
    var achievements=safeGet("flux-achievements",[]);
    var list=byId("achievement-list"); list.innerHTML="";
    if(!achievements.length) achievements=["First move — start playing"];
    achievements.forEach(function(item){var li=document.createElement("li");li.textContent=item;list.appendChild(li);});
    var scores=safeGet("flux-leaderboard",[]);
    var board=byId("leaderboard-list");board.innerHTML="";
    if(!scores.length)scores=[{score:0,date:"Play a run to get on the board"}];
    scores.slice(0,5).forEach(function(item){var li=document.createElement("li");li.textContent=formatNumber(item.score)+" · "+item.date;board.appendChild(li);});
  }
  function unlock(name){
    var items=safeGet("flux-achievements",[]);
    if(items.indexOf(name)===-1){items.push(name);safeSet("flux-achievements",items);renderLists();}
  }
  function playTone(){
    if(!soundEnabled)return;
    try{
      var Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      audioContext=audioContext||new Audio();
      var oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
      oscillator.type="sine";oscillator.frequency.value=520;
      gain.gain.setValueAtTime(.055,audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.13);
      oscillator.connect(gain);gain.connect(audioContext.destination);
      oscillator.start();oscillator.stop(audioContext.currentTime+.13);
    }catch(e){}
  }
  function finishRun(metadata){
    if(!metadata.over)return;
    var scores=safeGet("flux-leaderboard",[]);
    scores.push({score:metadata.score,date:new Date().toLocaleDateString()});
    scores.sort(function(a,b){return b.score-a.score;});
    safeSet("flux-leaderboard",scores.slice(0,5));
    renderLists();
  }
  window.FluxFeatures={
    t:function(key){return (translations[currentLanguage]||translations.en)[key]||key;},
    formatNumber:formatNumber,
    init:function(instance){
      game=instance;
      var lang=safeGet("flux-language","en");
      var theme="classic";
      safeSet("flux-theme","classic");
      byId("language").value=lang;byId("theme").value=theme;byId("board-size").value=String(game.size);
      document.body.className="theme-"+theme;applyLanguage(lang);renderLists();
      byId("language").addEventListener("change",function(){applyLanguage(this.value);});
      byId("theme").addEventListener("change",function(){document.body.className="theme-"+this.value;safeSet("flux-theme",this.value);});
      byId("board-size").addEventListener("change",function(){game.setBoardSize(this.value);byId("flux-status").textContent="New "+this.value+" × "+this.value+" game";});
      byId("undo-button").addEventListener("click",function(){var ok=game.undo();byId("flux-status").textContent=ok?"Last move undone":"Nothing to undo yet";});
      byId("hint-button").addEventListener("click",function(){var d=game.getHint();var arrows=["↑ Up","→ Right","↓ Down","← Left"];byId("flux-status").textContent=d===null?"No legal moves":("Try "+arrows[d]);});
      byId("daily-button").addEventListener("click",function(){game.startDailyChallenge();byId("board-size").value="4";byId("flux-status").textContent="Daily challenge · "+new Date().toLocaleDateString();});
      byId("sound-button").addEventListener("click",function(){soundEnabled=!soundEnabled;this.setAttribute("aria-pressed",String(soundEnabled));applyLanguage(byId("language").value);if(soundEnabled)playTone();});
    },
    onGameUpdate:function(metadata,grid){
      if(metadata.score>lastScore)playTone();lastScore=metadata.score;
      var max=0;grid.eachCell(function(x,y,tile){if(tile&&tile.value>max)max=tile.value;});
      if(metadata.score>0)unlock("First merge · score points");
      if(max>=128)unlock("128 club · reach 128");
      if(max>=512)unlock("Power player · reach 512");
      if(max>=2048)unlock("2048 legend · reach 2048");
      if(metadata.score>=1000)unlock("Four digits · score 1,000");
      finishRun(metadata);
      byId("undo-button").disabled=!game.history.length;
    }
  };
})();