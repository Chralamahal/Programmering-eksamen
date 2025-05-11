//API-nøgle til OpenWeatherMap
let APIKey = 'c08bda268c7a1345f0c6932c1f0d07c8';
//Liste over allerede valgte byer så de ikke gentages
let selectedCities = [];
//Den aktuelle by brugeren skal gætte temperaturen i
let currentCity = null;
//Data indlæst fra JSON med byinformation
let jsonData = [];
//Temperaturen på den aktuelle by
let temperature = null;
//Koordinater og dimensioner for pj5.js-knappen i canvas
let buttonX = 100, buttonY = 300, buttonWidth = 200, buttonHeight = 50;

//Spillets tilstand: 'start', 'play', 'leaderboard', 'gameover'
let gameState = 'start';
//Liste med data til highscoretavlen
let leaderboardData = [];

//Knapper og inputfelter i spillet
let playButton, leaderboardButton, backButton, playAgainButton, yesButton, noButton;
let inputName, submitNameButton;

//Scoren og antal liv spilleren har
let score = 0;
let lives = 10;
let tempInput;
let submitButton;

//Styrer visning af den rigtige temperatur og om navn skal indtastes
let showActualTemp = false;
let actualTemp = null;
let nameSubmittedOrDeclined = false;

function preload() {
  //Indlæser bydata fra lokal JSON-fil
  loadJSON('citylist.json', data => {
    jsonData = data;
  });
}

function setup() {
  //Lytter til ændringer i leaderboard-data i databasen og opdaterer visningen
  database.collection('leaderboard').doc('players')
    .onSnapshot((doc) => {
      leaderboardData = doc.data().playerlist

      //Sorterer listen efter score (højeste først)
      leaderboardData = leaderboardData.sort((a, b) => (b.score > a.score) ? 1 : -1)
    })

  //Opsætter canvas og tekstformatering
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(16);

  //Play-knap som starter spillet
  playButton = createButton('Play');
  playButton.position(width / 2 - 50, height / 2 - 20);
  playButton.size(100, 40);
  playButton.mousePressed(() => {
    gameState = 'play';
    playButton.hide();
    leaderboardButton.hide();
  });

  //Knap til at vise leaderboardet
  leaderboardButton = createButton('Leaderboard');
  leaderboardButton.position(width / 2 - 50, height / 2 + 40);
  leaderboardButton.size(100, 40);
  leaderboardButton.mousePressed(() => {
    gameState = 'leaderboard';
    playButton.hide();
    leaderboardButton.hide();
    backButton.show();
  });

  //Knap til at gå tilbage til startsiden
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

  //Knap til at starte spillet forfra efter game over
  playAgainButton = createButton('Play Again');
  playAgainButton.position(width / 2 - 50, height / 2 + 80);
  playAgainButton.size(100, 40);
  playAgainButton.mousePressed(startNewGame);
  playAgainButton.hide();

  //Knap til at bekræfte indtastning af navn til leaderboard
  yesButton = createButton('Yes');
  yesButton.position(width / 2 - 50, height / 2 + 40);
  yesButton.size(100, 40);
  yesButton.mousePressed(() => {
    yesButton.hide();
    //Scriptet har irreteret mig, så som midlertidig løsning er knappen kun gemt væk
    yesButton.position(-200, 200);
    noButton.hide();
    inputName.show();
    submitNameButton.show();
  });
  yesButton.hide();

  //Knap til at afvise at indsende navn
  noButton = createButton('No');
  noButton.position(width / 2 - 50, height / 2 + 90);
  noButton.size(100, 40);
  noButton.mousePressed(() => {
    yesButton.hide();
    noButton.hide();
    nameSubmittedOrDeclined = true;
  });
  noButton.hide();

  //Inputfelt til navn
  inputName = createInput();
  inputName.position(width / 2 - 50, height / 2 + 40);
  inputName.size(100);
  inputName.hide();

  //Knap til at indsende navn til leaderboard
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

  //Input og knap til temperaturgæt
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
    //Startskærm
    textSize(24);
    fill(0);
    text("Welcome to the Temperature Game", width / 2, height / 3);
  } else if (gameState == 'play') {
    //Spilskærm med temperaturgæt og knap
    fill(70, 130, 180);
    rect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
    fill(255);
    let buttonText;

    //Viser knaptekst afhængigt af om svaret er vist
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

    //Viser aktuel by og temperaturresultat
    if (currentCity && temperature !== null) {
      textSize(18);
      text(`${currentCity.city}`, width / 2, 100);

      if (showActualTemp) {
        //Viser den rigtige temperatur hvis svaret er givet
        textSize(16);
        fill(0);
        text(`Actual Temp: ${actualTemp} °C`, width / 2, 150);
        tempInput.hide();
        submitButton.hide();
      } else {
        //Viser input og knap til gæt
        tempInput.show();
        submitButton.show();
      }
    } else {
      //Skjuler input hvis by eller temperatur ikke er tilgængelig
      tempInput.hide();
      submitButton.hide();
    }
  } else if (gameState == 'leaderboard') {
    //Viser top-10 spillere
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
    //Game over skærm
    tempInput.hide();
    submitButton.hide();

    textSize(20);
    fill(200, 0, 0);
    text("Game Over", width / 2, height / 2 - 40);
    textSize(16);
    text(`Final Score: ${score}`, width / 2, height / 2 - 10);

    leaderboardData.sort((a, b) => b.score - a.score);

    //Tjekker om spilleren kvalificerer sig til leaderboard
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
    //Tjekker om spilleren klikker på knappen
    if (
      mouseX > buttonX && mouseX < buttonX + buttonWidth &&
      mouseY > buttonY && mouseY < buttonY + buttonHeight
    ) {
      if (lives > 0) {
        //Hvis vi allerede har vist temperaturen, hentes en ny by
        if (showActualTemp) {
          showActualTemp = false;
          getRandomCity();
        } else {
          //Hvis ikke, vises temperaturen først
          getRandomCity();
        }
      }
    }
  }
}

function getRandomCity() {
  let randomCity;
  let cityAlreadyPicked;
  //Do-while sikrer at vi finder en ny by, der ikke allerede er brugt
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
    //Tjekker om byen allerede er valgt før
    cityAlreadyPicked = selectedCities.some(c => c.id == randomCity.id);
  } while (cityAlreadyPicked); //Gentager indtil en unik by er valgt
  selectedCities.push(randomCity);
  currentCity = randomCity;
  const lat = currentCity.coordinates.latitude;
  const lon = currentCity.coordinates.longitude;
  fetchTemperature(lat, lon);
}

//Henter temperaturen for en given bredde- og længdegrad via OpenWeatherMap API
async function fetchTemperature(lat, lon) {
  //Samler API-URL med lat, lon og API-nøgle samt enhed (Celsius)
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKey}&units=metric`;
  //Venter på svar fra API'en via fetch
  const response = await fetch(url);
  //Parser svaret som JSON
  const data = await response.json();
  //Gemmer temperatur fra API-svaret
  temperature = data.main.temp;
}


//Funktion der tjekker spillerens gæt mod den faktiske temperatur
function checkGuess() {
  //Læser gæt fra inputfeltet og konverterer det til et int
  const guess = parseInt(tempInput.value());
  //Afrunder den faktiske temperatur for at gøre sammenligningen enklere
  actualTemp = Math.round(temperature);
  //Hvis inputtet er et gyldigt tal (ikke NaN)
  if (!isNaN(guess)) {
    //Beregner forskellen mellem gæt og faktisk temperatur
    const diff = Math.abs(guess - actualTemp);
    //Trækker forskellen fra antallet af liv (jo større fejl, jo flere liv tabes)
    lives -= diff;
    //Hvis spilleren stadig har liv tilbage, får de et point
    if (lives > 0) {
      score += 1;
    } else {
      //Hvis ingen liv er tilbage, afsluttes spillet
      gameState = 'gameover';
    }
    //Rydder inputfeltet efter gæt
    tempInput.value("");
    //Viser den faktiske temperatur efter gæt
    showActualTemp = true;
    //Skjuler inputfelt og knap til næste runde
    tempInput.hide();
    submitButton.hide();
  }
}
//Nulstiller alt, så spilles kan begyndes på ny
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
  //Henter spillerens navn fra inputfeltet
  const playerName = inputName.value();

  //Tilføjer spillerens navn og score til leaderboard
  leaderboardData.push({ name: playerName, score: score });

  //Sorterer leaderboardet så den højeste score kommer først
  leaderboardData.sort((a, b) => b.score - a.score);

  //Beholder kun de 10 bedste scores
  leaderboardData = leaderboardData.slice(0, 10);

  //Opdaterer Firestore-databasen med den nye top-10 liste
  database.collection('leaderboard').doc('players').set({
    playerlist: leaderboardData
  });

  //Nulstiller spillets UI og tilstand efter navn er tilføjet
  gameState = 'start';
  inputName.hide();
  submitNameButton.hide();
  yesButton.hide();
  noButton.hide();
  playAgainButton.hide();
  //Viser "Play"-knap igen
  playButton.show();
  //Viser "Leaderboard"-knap igen
  leaderboardButton.show();

  //Nulstiller score og liv til en ny start
  score = 0;
  lives = 10;
  tempInput.value("");
  showActualTemp = false; 
}