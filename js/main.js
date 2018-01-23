window.onload = function (){
  var game = new Game();

  var startpage = document.querySelector('.startPage');
  var restartpage = document.querySelector('.restartPage');
  var startBtn = document.querySelector('.startBtn');
  var restartBtn = document.querySelector('.restartBtn');
  var scoreEl = document.querySelector('.scoreNum');

  startpage.style.display = 'flex';
  restartpage.style.display = 'none';

  startBtn.addEventListener('click', function (){
    startpage.style.display = 'none';
    game.start();
  });

  restartBtn.addEventListener('click', function (){
    restartpage.style.display = 'none';
    game.restart();
  });

  game.failCallback = function (score){
    restartpage.style.display = 'flex';
    scoreEl.innerHTML = score;
  };
}
