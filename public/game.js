/* -------------- BEGIN sets up stage and game rendering -------------- */
// aliases
var Container = PIXI.Container,
	autoDetectRenderer = PIXI.autoDetectRenderer,
	loader = PIXI.loader,
	resources = PIXI.loader.resources,
	Sprite = PIXI.Sprite,
	Graphics = PIXI.Graphics,
	Text = PIXI.Text,
	utils = PIXI.utils;

// create the renderer
var renderer = autoDetectRenderer(1000, 600, {backgroundColor : 0x0a3e74});
renderer.view.style.position = "absolute";
renderer.view.style.display = "block";
renderer.autoResize = true;
renderer.resize(window.innerWidth, window.innerHeight);

// create the stage
var stage = new Container();

// add canvas to the html
document.body.appendChild(renderer.view);

// setup tink for buttons and collision(TODO collision)
var t = new Tink(PIXI, renderer.view);
/* -------------- END sets up stage and game rendering -------------- */



/* -------------- BEGIN game variables -------------- */
// keeps track of the game state
var gameOver = true;
// current level
var level = 0;
// lives left
var lives = 3;
// current obstacles allowed to pass
var obstaclesPassed = 0;
// current obstacles that have been spawned
var obstaclesSpawned = 0;
// main player sprite
var player;
// main menu start button
var startButton;
// text sprite displayed to the user
var mainMessage = "";
// text sprite handling user lives
var lifeMessage = "";
// text sprite handling current level
var levelMessage = "";
// text sprite handling obstacle count
var obstacleMessage = "";
// list of obstacles blocking the player
var obstacles = [];
// list of locations obstacles can spawn
var spawnLocations = [];
// list of if obstacles can be spawned
var canSpawn = [];
// keeps track of recently lost life
var recentlyLostLife = false;;
// keeps track if a level was just completed
var recentlyCompletedLevel = false;;
// keep track of key presses
var keyPressed = [];
/* -------------- END game variables -------------- */



/* -------------- BEGIN constants -------------- */
// keycodes
var WCODE = 87;
var ACODE = 65;
var SCODE = 83;
var DCODE = 68;
var LARROW = 37;
var RARROW = 39;
var UARROW = 38;
var DARROW = 40;
var SPACE = 32;

var OBSTACLELOCATIONS = 9;

// player movement
var MAXPVEL = 5;
var MINPVEL = -5;
var ACCELERATION = 0.5;
var DECELERATION = 0.25;

var BORDERSIZE = 7;

// obstacle movement
var maxovel = [0, 5, 6, 6, 7, 7, 8, 8, 9, 10, 12];
var minovel = [0, 4, 4, 3, 3, 3, 3, 3, 4, 5, 5];

// spawn rates
var minSpawnRate = [0, 200, 200, 200, 200, 150, 150, 150, 100, 100, 100];
var maxSpawnRate = [0, 700, 700, 600, 600, 600, 600, 500, 500, 500, 500];

// number of obstacles needed to pass to advance to the next level. currently 10 levels max
var levelObstacles = [0, 25, 50, 100, 150, 200, 250, 300, 400, 500, 1000];
// obstacles colors based on level
var obstacleColors = [0x000000, 0xF4D03F, 0x2ECC71, 0X3498DB, 0X8E44AD, 0X2C3E50, 0XECF0F1, 0XE67E22, 0XFA8072, 0XFE2EF7, 0X190707];
/* -------------- END constants -------------- */


var far;


/* -------------- BEGIN setup and game state functions -------------- */
function setup() {
	console.log("Starting main menu");

	// bg
	createBackground();

	// show main menu "press space to play"
	createMainMenuButtons();

	// calculates locations the obstacles can spawn
	constructSpawnLocations();

	// kick off game loop
	gameLoop();
	//setInterval(gameLoop, 10);
}

function gameLoop() {
	// loop the game 60 times a second
	requestAnimationFrame(gameLoop);

	// handles user input
	play();

	// update tink for button
	// could improve render speed by not updating tink when no button is displayed
	t.update();

	// renders the content on the screen
	renderer.render(stage);
}

function startGame() {
	console.log("Starting game at level 1");

	// clears the screen
	clearScreen();

	// updates the game state
	resetGameState();

	// creates the player
	createPlayer();

	// adds or updates the life and level message sprites
	createMessageSprites();

	// begins spawning obstacles in 1 sec
	setTimeout(spawnObstacle, 1000);
}

function play() {
	// game is over, waiting for user to press space to play again
	if (gameOver) {
		// start the game over
		if (keyPressed[SPACE]) {
			// start level 1
			startGame();
		}
	// game is not over, continue letting user move the player
	} else {
		updateBackground();

		// pauses player and obstacles if a level was just lost
		if (!recentlyLostLife) {
			// handle player movement
			updatePlayer();

			// move obstacles
			updateObstacles();
		}

		// just completed a level
		if (recentlyCompletedLevel) {
			// move to the next level only if all obstacles are clear
			if (keyPressed[SPACE] && obstacles.length === 0) {
				nextLevel();
			}
		}
	}
}

function updateBackground() {
	far.tilePosition.y += 0.5;
}

function resetGameState() {
	gameOver = false;
	recentlyLostLife = false;
	recentlyCompletedLevel = false;

	level = 1;
	lives = 3;
	obstaclesPassed = 0;
	obstaclesSpawned = 0;
}

function endGame() {
	// changes the game state
	gameOver = true;

	// displays text to play again
	createText("Game over! Press space to play again");
}

function loseLife() {
	decrementLifeCount();
	recentlyLostLife = true;

	// out of lives, game over
	if (lives === 0) {
		endGame();
	} else {
		// clear all the current obstacles on the screen
		setTimeout(restartLife, 1500);
	}
}

function restartLife() {
	// need to respawn the ones on the screen that the user hasn't passed
	obstaclesSpawned -= obstacles.length;

	clearObstacles();
	recentlyLostLife = false;

	if (!checkCompletedLevel()) {
		resetPlayer();

		recentlyCompletedLevel = false;
		spawnObstacle();
	}
}

function resetPlayer() {
	// centers player since the x,y are in the top left corner
	player.x = renderer.width / 2 - player.width / 2;
	player.y = renderer.height / 2 - player.height / 2;

	player.xv = 0;
	player.yv = 0;
}

function nextLevel() {
	if (level === 10) {
		createText("YOU WIN THE GAME!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
		return;
	}

	incrementLevelCount();

	clearMainMessage();

	resetObstacleCount();
	recentlyCompletedLevel = false;

	// kick off new obstacles
	setTimeout(spawnObstacle, 1000);
}

function checkCompletedLevel() {
	// completed the required obstacles to advance to the next level
	if (obstaclesPassed === levelObstacles[level]) {
		// stops spawning new obstacles, allows the
		// current obstacles on the screen to clear
		recentlyCompletedLevel = true;
		createText("Level "+level+" complete! Press space to advance to the next level");

		return true;
	// advance to the next level
	}

	return false;
}

// progress handler
function loadProgressHandler(loader, resource) {
	// display file url being loaded
	console.log("loading: " + resource.url);

	// display percentage of files loaded
	console.log("progress: " + loader.progress + "%");
}
/* -------------- END setup and game state functions -------------- */



/* -------------- BEGIN rendering -------------- */
function upPressed() {
	return keyPressed[WCODE] || keyPressed[UARROW];
}

function downPressed() {
	return keyPressed[SCODE] || keyPressed[DARROW];
}

function leftPressed() {
	return keyPressed[ACODE] || keyPressed[LARROW];
}

function rightPressed() {
	return keyPressed[DCODE] || keyPressed[RARROW];
}

function updatePlayer() {
	// updates velocities based on our accel/deceleration values
	// so the player's movement is smoother
	// W
	if (upPressed()) {
		// accelerate in the negative y direction
		if (player.yv > MINPVEL) {
			player.yv -= ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!downPressed() && player.yv < 0) {
			player.yv += DECELERATION;
		}
	}

	// A
	if (leftPressed()) {
		// accelerate in the negative x direction
		if (player.xv > MINPVEL) {
			player.xv -= ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!rightPressed() && player.xv < 0) {
			player.xv += DECELERATION;
		}
	}

	// S
	if (downPressed()) {
		// accelerate in the positive y direction
		if (player.yv < MAXPVEL) {
			player.yv += ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!upPressed() && player.yv > 0) {
			player.yv -= DECELERATION;
		}
	}

	// D
	if (rightPressed()) {
		// accelerate in the positive x direction
		if (player.xv < MAXPVEL) {
			player.xv += ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!leftPressed() && player.xv > 0) {
			player.xv -= DECELERATION;
		}
	}

	// updates position
	player.x += player.xv;
	player.y += player.yv;

	// maintains bounds
	maintainPlayerBounds();
}

function updateObstacles() {
	obstacles.forEach(function(obstacle) {
		// render obstacle
		obstacle.moveUp();
		obstacle.rotation += obstacle.rotationSpeed;

		// removes obstacle if its off the screen
		// checks obstacle collisions
		checkObstacleBounds(obstacle);
	});
}

function clearScreen() {
	// even after removing from screen, the button still is clickable
	// for now, move it completely off the screen
	startButton.x = -500;
	startButton.y = -500;

	// remove message and player
	stage.removeChild(mainMessage);
	stage.removeChild(startButton);
	stage.removeChild(lifeMessage);
	stage.removeChild(levelMessage);
	stage.removeChild(obstacleMessage);
	stage.removeChild(player);

	clearObstacles();
}

function removeObstacle(obstacle) {
	// removes obstacle from our internal list and from the screen
	let index = obstacles.indexOf(obstacle);
	obstacles.splice(index, 1);
	stage.removeChild(obstacle);
}

function clearObstacles() {
	obstacles.forEach(function(obstacle) {
		stage.removeChild(obstacle);
	});
	obstacles = [];
}

function incrementLevelCount() {
	level++;
	updateLevelMessage();
}

function decrementLifeCount() {
	lives--;
	updateLifeMessage();
}

function incrementObstaclesPassed() {
	obstaclesPassed++;
	updateObstacleMessage();
}

function resetObstacleCount() {
	obstaclesPassed = 0;
	obstaclesSpawned = 0;
	updateObstacleMessage();
}

function updateLifeMessage() {
	lifeMessage.text = "Lives: " + lives;
}

function updateLevelMessage() {
	levelMessage.text = "Level: " + level;
}

function updateObstacleMessage() {
	obstacleMessage.text = obstaclesPassed + "/" + levelObstacles[level];
}

function clearMainMessage() {
	mainMessage.text = "";
}

function spawnObstacle() {
	// if the game ends, but set timeout is still going to call this function
	// we want to ignore it so obstacles aren't added after the game ends
	if (canSpawnObstacle()) {
		// creates and adds an obstacle to the screen
		createObstacle();
		obstaclesSpawned++;

		// spawns another obstacle in a random time
		let t = randomSpawnTime();
		setTimeout(spawnObstacle, t);
	}
}

function chooseSpawnLocationIndex() {
	// possible spawn locations
	let poss = [];

	// gets all possible spawn location indices
	let i;
	for (i = 0; i < OBSTACLELOCATIONS; i++) {
		if (canSpawn[i]) {
			poss.push(i);
		}
	}

	// no available locations at the moment
	if (poss.length === 0) {
		return -1;
	}

	// picks a random one of the possibilities
	let r = Math.floor(Math.random() * poss.length);
	let slotIndex = poss[r];

	// can't spawn in the same slot for 1s
	canSpawn[slotIndex] = false;
	setTimeout(function() { canSpawn[slotIndex] = true; }, 1000);

	return slotIndex;
}

function randomObstacleSpeed() {
	let max = maxovel[level];
	let min = minovel[level];
	return Math.floor(Math.random() * (max-min+1)) + min;
}

function randomSpawnTime() {
	let max = maxSpawnRate[level];
	let min = minSpawnRate[level];
	return Math.floor(Math.random() * (max-min+1)) + min;
}

function canSpawnObstacle() {
	return !gameOver && !recentlyLostLife && !recentlyCompletedLevel && obstaclesSpawned < levelObstacles[level];
}
/* -------------- END rendering -------------- */



/* -------------- BEGIN collision -------------- */
function hitTestRectCircle(r, c) {
	// determines if a rectangle and circle are intersecting
	// i.e. center of circle is within one radius away from rect edges

	// finds the center of the rectangle and circle
	let rx = r.x + r.width / 2;
	let ry = r.y + r.height / 2;
	let cx = c.x;
	let cy = c.y;

	// circle distance x and y
	let cdx = Math.abs(cx - rx);
	let cdy = Math.abs(cy - ry);

	// circle center is farther than half the rect + circle radius from rect center
	if (cdx > (r.width / 2 + c.radius)) { return false; }
	if (cdy > (r.height / 2 + c.radius)) { return false; }

	// circle center is inside rectangle
	if (cdx <= (r.width / 2)) { return true; }
	if (cdy <= (r.height / 2)) { return true; }

	// finds the distance between the circle center and the 
	// rectangle corner and checks if it is less than the radius
	corner_sq = Math.pow(cdx - r.width / 2, 2) + Math.pow(cdy - r.height / 2, 2);
	return corner_sq <= Math.pow(c.radius, 2);

}

function hitTestRectangle(r1, r2) {

  //Define the variables we'll need to calculate
  var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x;// + r1.width / 2;
  r1.centerY = r1.y;// + r1.height / 2;
  r2.centerX = r2.x;// + r2.width / 2;
  r2.centerY = r2.y;// + r2.height / 2;

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};

function maintainPlayerBounds() {
	// keeps player inside the game screen. resets its velocity if it hits a wall

	// player tries to leave from the top
	if (player.y < 0) {
		player.y = 0;
		player.yv = 0;
	}

	// player tries to leave from the left
	if (player.x < 0) {
		player.x = 0;
		player.xv = 0;
	}

	// player tries to leave from the bottom
	if (player.y > renderer.height - player.height) {
		player.y = renderer.height - player.height;
		player.yv = 0;
	}

	// player tries to leave from the right
	if (player.x > renderer.width - player.width) {
		player.x = renderer.width - player.width;
		player.xv = 0;
	}
}

function playerObstacleCollision(p, o) {
	// detects collision between player and obstacle
	// splits player up into two hitboxes
	// checks if either of those collide with the asteroids hitbox
	let verticalHitbox = { 
		height : p.height,
		width : p.width / 3,
		x : p.x + p.width / 3,
		y : p.y
	};

	let horizontalHitbox = {
		height : p.height / 3,
		width : p.width,
		x : p.x,
		y : p.y + p.height * 2 / 3
	};

	let obstacleHitbox = {
		x : o.x,
		y : o.y,
		radius : o.radius * 0.8
	};

	return hitTestRectCircle(verticalHitbox, obstacleHitbox) || hitTestRectCircle(horizontalHitbox, obstacleHitbox);
}

function checkObstacleBounds(obstacle) {
	// player hit the obstacle
	if (playerObstacleCollision(player, obstacle)) {
		console.log("player obstacle collision");
		loseLife();
	} else if (obstacleOutOfRange(obstacle)) {
		// obstacle has left the screen, remove it
		removeObstacle(obstacle);

		// update text
		incrementObstaclesPassed();

		// checks if the level has been completed
		checkCompletedLevel();
	}
}

function obstacleOutOfRange(obstacle) {
	return obstacle.y > renderer.height + obstacle.radius;
}
/* -------------- END collision -------------- */



/* -------------- BEGIN constructors -------------- */
function constructSpawnLocations() {
	let i = 0;
	let obstacleRad = Math.floor(0.04802 * renderer.width);

	// divides screen into OBSTACLELOCATIONS number of slots
	for (i = 0; i < OBSTACLELOCATIONS; i++) {
		let loc = Math.floor((renderer.width / OBSTACLELOCATIONS) * i) + obstacleRad;
		spawnLocations.push(loc);
		canSpawn.push(true);
	}
}

function createPlayer() {
	player = new Sprite(
		loader.resources["img/rocket.png"].texture
	);

	// scale with precalculated constants
	let pside = Math.floor(0.04802 * renderer.width);

	player.height = pside * (872/600);
	player.width = pside;

	// puts player in the middle of the screen
	resetPlayer();

	// add player to screen
	stage.addChild(player);
}

function createObstacle() {
	// chooses a random location of the available locations
	let ri = chooseSpawnLocationIndex();
	// no available locations at the moment
	if (ri === -1) {
		return;
	}

	// creates the graphics object
	let obstacle = new Sprite(
		loader.resources["img/asteroid.png"].texture
	);

	let oside = Math.floor(0.04802 * renderer.width);

	obstacle.height = oside * 2;
	obstacle.width = oside * 2;
	obstacle.radius = oside;

	obstacle.anchor.x = 0.5;
	obstacle.anchor.y = 0.5;

	obstacle.rotationSpeed = Math.random()*0.1+0.02;

	// sets the obstacle position
	obstacle.x = spawnLocations[ri];
	obstacle.y = 0 - obstacle.height;

	// adds obstacle movement
	obstacle.speed = -1 * randomObstacleSpeed();
	obstacle.moveUp = function() {
		obstacle.y -= obstacle.speed;
	}

	// add obstacle to the list
	obstacles.push(obstacle);

	// add obstacle to the stage
	stage.addChild(obstacle);
}

function createText(s) {
	// take a string and display it on the screen
	mainMessage = new Text(s, 
		{fontFamily: "Arial", 
		fontSize: 64, 
		fill: "white", 
		wordWrap: true, 
		wordWrapWidth: renderer.width, 
		align: "center"}
	);
	
	// set text anchor to its center
	mainMessage.anchor.x = 0.5;
	mainMessage.anchor.y = 0.5;

	// set text position
	mainMessage.x = renderer.width / 2;
	mainMessage.y = renderer.height / 2;

	// add message to the stage
	stage.addChild(mainMessage);
}

function createBackground() {
	var farTexture = PIXI.Texture.fromImage("img/bg.png");
	far = new PIXI.extras.TilingSprite(farTexture, renderer.width, renderer.height);
	far.position.x = 0;
	far.position.y = 0;
	far.tilePosition.x = 0;
	far.tilePosition.y = 0;
	stage.addChild(far);
}

function createLifeMessage() {
	// creates the text sprite
	lifeMessage = new Text("Lives: 3", 
		{
			fontFamily: "Arial", 
			fontSize: 32, 
			fill: "white"
		}
	);

	// set text position
	lifeMessage.x = BORDERSIZE;
	lifeMessage.y = BORDERSIZE;

	// adds it to the stage
	stage.addChild(lifeMessage);
}

function createLevelMessage() {
	// creates the text sprite
	levelMessage = new Text("Level: 1",
		{
			fontFamily: "Arial",
			fontSize: 32,
			fill: "white"
		}
	);

	// set text position
	levelMessage.x = BORDERSIZE;
	levelMessage.y = BORDERSIZE + lifeMessage.height + BORDERSIZE;

	// adds it to the stage
	stage.addChild(levelMessage);
}

function createObstacleMessage() {
	// creates the text sprite
	obstacleMessage = new Text(obstaclesPassed + "/" + levelObstacles[level],
		{
			fontFamily: "Arial",
			fontSize: 32,
			fill: "white"
		}	
	);

	// set text position
	obstacleMessage.x = BORDERSIZE;
	obstacleMessage.y = levelMessage.y + levelMessage.height + BORDERSIZE;

	// add to the stage
	stage.addChild(obstacleMessage);
}

function createStartButton() {
	let id = PIXI.loader.resources["img/start_button.json"].textures;

	let buttonFrames = [
    	id[2],
    	id[1],
    	id[0]
	];

	startButton = t.button(buttonFrames);

	startButton.height = Math.floor(0.15495 * renderer.height);//150;
	startButton.width = Math.floor(0.18007 * renderer.width);//300;
	startButton.anchor.x = 0.5;
	startButton.anchor.y = 0.5;
	startButton.x = renderer.width / 2;
	startButton.y = renderer.height / 2;

	startButton.release = () => {
		startGame();
	}

	stage.addChild(startButton);
}

function createMessageSprites() {
	createLifeMessage();
	createLevelMessage();
	createObstacleMessage();
}

function createMainMenuButtons() {
	createStartButton();	
}
/* -------------- END constructors -------------- */



/* -------------- BEGIN script body -------------- */
// key up
window.onkeyup = function(e) {
	keyPressed[e.keyCode] = false;
}

// key down
window.onkeydown = function(e) {
	keyPressed[e.keyCode] = true;
}

// load images and starts the game
loader
	.add(["img/start_button.json",
		  "img/rocket.png",
		  "img/asteroid.png",
		  "img/bg.png"])
	.on("progress", loadProgressHandler)
	.load(setup);
/* -------------- END script body -------------- */