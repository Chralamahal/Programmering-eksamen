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

function preload() {
  loadJSON('citylistSHORT.json', data => {
    jsonData = data;
  });
  /*loadJSON('leaderboard.json', data => {
    leaderboardData = data.sort((a, b) => b.score - a.score); // sort descending
  });*/


}


function setup() {

    //####################################################
    database.collection('leaderboard').doc('players')
    .onSnapshot( (doc) => {
    //console.log('Fik dette fra databasen: ', doc.data() )
    leaderboardData = doc.data().playerlist
    console.log(leaderboardData)

    leaderboardData = leaderboardData.sort( (a, b) => (a.score > b.score) ? 1 : -1)
    })
    //####################################################



  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(16);

  // Play button
  playButton = createButton('Play');
  playButton.position(width / 2 - 50, height / 2 - 20);
  playButton.size(100, 40);
  playButton.mousePressed(() => {
    gameState = 'play';
    playButton.hide();
    leaderboardButton.hide();
  });

  // Leaderboard button
  leaderboardButton = createButton('Leaderboard');
  leaderboardButton.position(width / 2 - 50, height / 2 + 40);
  leaderboardButton.size(100, 40);
  leaderboardButton.mousePressed(() => {
    gameState = 'leaderboard';
    playButton.hide();
    leaderboardButton.hide();
    backButton.show();
  });

  // Back button
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

  // Play again button
  playAgainButton = createButton('Play Again');
  playAgainButton.position(width / 2 - 50, height / 2 + 40);
  playAgainButton.size(100, 40);
  playAgainButton.mousePressed(startNewGame);
  playAgainButton.hide();

  // Yes button (for leaderboard entry)
  yesButton = createButton('Yes');
  yesButton.position(width / 2 - 50, height / 2 + 80);
  yesButton.size(100, 40);
  yesButton.mousePressed(addToLeaderboard);

 
  yesButton.hide();




  // No button (for leaderboard entry)
  noButton = createButton('No');
  noButton.position(width / 2 - 50, height / 2 + 120);
  noButton.size(100, 40);
  noButton.mousePressed(() => {
    playAgainButton.show();
    yesButton.hide();
    noButton.hide();
  });
  noButton.hide();

  // Name input for leaderboard
  inputName = createInput();
  inputName.position(width / 2 - 50, height / 2 + 80);
  inputName.size(100);
  inputName.hide();

  // Submit name button
  submitNameButton = createButton('Submit Name');
  submitNameButton.position(width / 2 - 50, height / 2 + 120);
  submitNameButton.size(100, 40);
  submitNameButton.mousePressed(addToLeaderboard);
  submitNameButton.hide();

  // Temp input and submit button
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

  if (gameState === 'start') {
    textSize(24);
    fill(0);
    text("Welcome to the Temperature Game", width / 2, height / 3);
  }

  else if (gameState === 'play') {
    // Draw button
    fill(70, 130, 180);
    rect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
    fill(255);
    text(showActualTemp ? "Next City" : "Get City Temperature", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);

    // Score and lives
    fill(0);
    textSize(14);
    text(`Score: ${score}`, 60, 20);
    text(`Lives: ${lives}`, width - 60, 20);

    if (currentCity && temperature !== null) {
      textSize(18);
      text(`${currentCity.city}`, width / 2, 100);

      if (lives <= 0) {
  tempInput.hide();
  submitButton.hide();
  textSize(20);
  fill(200, 0, 0);
  text("Game Over", width / 2, height / 2);
  textSize(16);
  text(`Final Score: ${score}`, width / 2, height / 2 + 30);
  playAgainButton.show();

  leaderboardData.sort((a, b) => b.score - a.score); // ensure it's sorted

  if (leaderboardData.length < 3 || score >= leaderboardData[2].score) {
    textSize(16);
    text("Do you want to add yourself to the leaderboard?", width / 2, height / 2 + 60);
    yesButton.show();
    noButton.show();
  }
}
 else if (showActualTemp) {
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
  }

  else if (gameState === 'leaderboard') {
  fill(0);
  textSize(22);
  text("Leaderboard", width / 2, 40);
  textSize(16);

  // Sort before displaying
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.score - a.score);

  for (let i = 0; i < sortedLeaderboard.length; i++) {
    const player = sortedLeaderboard[i];
    text(`${i + 1}. ${player.name}: ${player.score}`, width / 2, 80 + i * 30);
  }
}

}

function mousePressed() {
  if (gameState === 'play') {
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

    cityAlreadyPicked = selectedCities.some(c => c.id === randomCity.id);
  } while (cityAlreadyPicked);

  selectedCities.push(randomCity);
  currentCity = randomCity;

  const lat = currentCity.coordinates.latitude;
  const lon = currentCity.coordinates.longitude;

  fetchTemperature(lat, lon);
}

function fetchTemperature(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKey}&units=metric`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      temperature = data.main.temp;
    })
    .catch(err => {
      console.error("Failed to fetch temperature:", err);
    });
}

function checkGuess() {
  const guess = parseInt(tempInput.value());
  actualTemp = Math.round(temperature);

  if (!isNaN(guess)) {
    const diff = Math.abs(guess - actualTemp);
    lives -= diff;

    if (lives > 0) {
      score += 1;
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
}

function addToLeaderboard() {
  const playerName = inputName.value();
  leaderboardData.push({ name: playerName, score: score });

  leaderboardData.sort((a, b) => b.score - a.score);
  leaderboardData = leaderboardData.slice(0, 3);

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
}