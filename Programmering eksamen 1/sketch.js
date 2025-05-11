let APIKey = 'c08bda268c7a1345f0c6932c1f0d07c8';

let selectedCities = [];
let currentCity = null;
let jsonData = [];
let temperature = null;
let buttonX = 100, buttonY = 300, buttonWidth = 200, buttonHeight = 50;

let gameState = 'start';
let leaderboardData = [];
let playButton, leaderboardButton, backButton, playAgainButton, yesButton, noButton;
let inputName, submitNameButton;

let score = 0;
let lives = 10;
let tempInput;
let submitButton;

let showActualTemp = false;
let actualTemp = null;
let nameSubmittedOrDeclined = false;

function preload() {
  loadJSON('citylist.json', data => {
    jsonData = data;
  });
}

function setup() {
  database.collection('leaderboard').doc('players')
    .onSnapshot( (doc) => {
    //console.log('Fik dette fra databasen: ', doc.data() )
    leaderboardData = doc.data().playerlist
    

    leaderboardData = leaderboardData.sort( (a, b) => (b.score > a.score) ? 1 : -1)
    //console.log(leaderboardData)
    })

  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(16);

  playButton = createButton('Play');
  playButton.position(width / 2 - 50, height / 2 - 20);
  playButton.size(100, 40);
  playButton.mousePressed(() => {
    gameState = 'play';
    playButton.hide();
    leaderboardButton.hide();
  });

  leaderboardButton = createButton('Leaderboard');
  leaderboardButton.position(width / 2 - 50, height / 2 + 40);
  leaderboardButton.size(100, 40);
  leaderboardButton.mousePressed(() => {
    gameState = 'leaderboard';
    playButton.hide();
    leaderboardButton.hide();
    backButton.show();
  });

  backButton = createButton('Back');
  backButton.position(10, 10);
  backButton.size(60, 30);
  backButton.mousePressed(() => {
    gameState = 'start';
    backButton.hide();
    playButton.show();
    leaderboardButton.show();
  });
  backButton.hide();

  playAgainButton = createButton('Play Again');
  playAgainButton.position(width / 2 - 50, height / 2 + 80);
  playAgainButton.size(100, 40);
  playAgainButton.mousePressed(startNewGame);
  playAgainButton.hide();

  yesButton = createButton('Yes');
  yesButton.position(width / 2 - 50, height / 2 + 40);
  yesButton.size(100, 40);
  yesButton.mousePressed(() => {
    yesButton.hide();
    //mit script drillede, så jeg smed bare knappen ud af canvas
    yesButton.position(-200, 200)
    noButton.hide();
    inputName.show();
    submitNameButton.show();
  });
  yesButton.hide();

  noButton = createButton('No');
  noButton.position(width / 2 - 50, height / 2 + 90);
  noButton.size(100, 40);
  noButton.mousePressed(() => {
    yesButton.hide();
    noButton.hide();
    nameSubmittedOrDeclined = true;
  });
  noButton.hide();

  inputName = createInput();
  inputName.position(width / 2 - 50, height / 2 + 40);
  inputName.size(100);
  inputName.hide();

  submitNameButton = createButton('Submit Name');
  submitNameButton.position(width / 2 - 50, height / 2 + 90);
  submitNameButton.size(100, 40);
  submitNameButton.mousePressed(() => {
    addToLeaderboard();
    inputName.hide();
    submitNameButton.hide();
    nameSubmittedOrDeclined = true;
  });
  submitNameButton.hide();

  tempInput = createInput();
  tempInput.position(width / 2 - 50, 180);
  tempInput.size(100);
  tempInput.hide();

  submitButton = createButton("Submit Guess");
  submitButton.position(width / 2 - 50, 220);
  submitButton.size(100, 30);
  submitButton.mousePressed(checkGuess);
  submitButton.hide();
}

function draw() {
  background(220);

  if (gameState == 'start') {
    textSize(24);
    fill(0);
    text("Welcome to the Temperature Game", width / 2, height / 3);
  } else if (gameState == 'play') {
    fill(70, 130, 180);
    rect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
    fill(255);
    let buttonText;
    if (showActualTemp) {
    buttonText = "Next City";
    } else {
    buttonText = "Get City Temperature";
    }
    text(buttonText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);

    fill(0);
    textSize(14);
    text(`Score: ${score}`, 60, 20);
    text(`Lives: ${lives}`, width - 60, 20);

    if (currentCity && temperature !== null) {
      textSize(18);
      text(`${currentCity.city}`, width / 2, 100);

      if (showActualTemp) {
        textSize(16);
        fill(0);
        text(`Actual Temp: ${actualTemp} °C`, width / 2, 150);
        tempInput.hide();
        submitButton.hide();
      } else {
        tempInput.show();
        submitButton.show();
      }
    } else {
      tempInput.hide();
      submitButton.hide();
    }
  } else if (gameState == 'leaderboard') {
    fill(0);
    textSize(22);
    text("Leaderboard", width / 2, 40);
    textSize(16);

    const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.score - a.score);
    for (let i = 0; i < sortedLeaderboard.length; i++) {
      const player = sortedLeaderboard[i];
      text(`${i + 1}. ${player.name}: ${player.score}`, width / 2, 80 + i * 30);
    }
  } else if (gameState == 'gameover') {
    tempInput.hide();
    submitButton.hide();

    textSize(20);
    fill(200, 0, 0);
    text("Game Over", width / 2, height / 2 - 40);
    textSize(16);
    text(`Final Score: ${score}`, width / 2, height / 2 - 10);

    leaderboardData.sort((a, b) => b.score - a.score);

    if (leaderboardData.length < 10 || score > leaderboardData[leaderboardData.length - 1].score) {
      if (!nameSubmittedOrDeclined) {
        text("Do you want to add yourself to the leaderboard?", width / 2, height / 2 + 20);
        yesButton.show();
        noButton.show();
      } else {
        playAgainButton.show();
      }
    } else {
      playAgainButton.show();
    }
  }
}

function mousePressed() {
  if (gameState == 'play') {
    if (
      mouseX > buttonX && mouseX < buttonX + buttonWidth &&
      mouseY > buttonY && mouseY < buttonY + buttonHeight
    ) {
      if (lives > 0) {
        if (showActualTemp) {
          showActualTemp = false;
          getRandomCity();
        } else {
          getRandomCity();
        }
      }
    }
  }
}

function getRandomCity() {
  let randomCity;
  let cityAlreadyPicked;

  do {
    const randomIndex = floor(random(jsonData.length));
    randomCity = {
      id: jsonData[randomIndex].id,
      city: jsonData[randomIndex].name,
      state: jsonData[randomIndex].state || null,
      country: jsonData[randomIndex].country,
      coordinates: {
        latitude: jsonData[randomIndex].coord.lat,
        longitude: jsonData[randomIndex].coord.lon
      }
    };

    cityAlreadyPicked = selectedCities.some(c => c.id == randomCity.id);
  } while (cityAlreadyPicked);

  selectedCities.push(randomCity);
  currentCity = randomCity;

  const lat = currentCity.coordinates.latitude;
  const lon = currentCity.coordinates.longitude;

  fetchTemperature(lat, lon);
}

async function fetchTemperature(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKey}&units=metric`;
  const response = await fetch(url);
  const data = await response.json();
  temperature = data.main.temp;
}

function checkGuess() {
  const guess = parseInt(tempInput.value());
  actualTemp = Math.round(temperature);

  if (!isNaN(guess)) {
    const diff = Math.abs(guess - actualTemp);
    lives -= diff;

    if (lives > 0) {
      score += 1;
    } else {
      gameState = 'gameover';
    }

    tempInput.value("");
    showActualTemp = true;
    tempInput.hide();
    submitButton.hide();
  }
}

function startNewGame() {
  score = 0;
  lives = 10;
  selectedCities = [];
  currentCity = null;
  temperature = null;
  showActualTemp = false;
  gameState = 'play';
  playAgainButton.hide();
  getRandomCity();
  nameSubmittedOrDeclined = false;
  tempInput.value(""); 
}

function addToLeaderboard() {
  const playerName = inputName.value();
  leaderboardData.push({ name: playerName, score: score });

  leaderboardData.sort((a, b) => b.score - a.score);
  leaderboardData = leaderboardData.slice(0, 10);

  database.collection('leaderboard').doc('players').set({
    playerlist: leaderboardData
  });

  // Reset UI
  gameState = 'start';
  inputName.hide();
  submitNameButton.hide();
  yesButton.hide();
  noButton.hide();
  playAgainButton.hide();
  playButton.show();
  leaderboardButton.show();
  score = 0;
  lives = 10;
  tempInput.value(""); 
  showActualTemp = false;
}