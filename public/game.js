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
// panning background
var far;
// main menu start button
var startButton;
// information bar
var infoBar;
// text sprite displayed to the user
var mainMessage = "";
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
// power up item
var powerUps = [];
// lasers flying around
var lasers = [];
// life sprites
var lifeSprites = [];
// keeps track of recently lost life
var recentlyLostLife = false;
// keeps track of laser shots
var recentlyShotLaser = false;
// keeps track if a level was just completed
var recentlyCompletedLevel = false;
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

// enum for powerup types
var PowerUpType = {
	HALFSIZE : 0,
	DOUBLESIZE : 1,
	LASERS : 2,
	TWIN : 3
};
var NUM_POWERUPS = 4;
var POWERUP_DURATION = 5000;
var POWERUP_SPAWNRATE = 10;

var LASER_SPEED = 20;

// player movement
var MAXPVEL = 5;
var MINPVEL = -5;
var ACCELERATION = 0.2;
var DECELERATION = 0.05;

var INFO_BAR_HEIGHT = 65;
var SCREEN_TOP = 0;
var SCREEN_BOTTOM = renderer.height - INFO_BAR_HEIGHT;
var BORDER_SIZE = 7;
var OBSTACLE_LOCATIONS = 9;

// player size
var DEFAULT_PLAYER_HEIGHT = Math.floor(0.04802 * renderer.width) * (872/600);
var DEFAULT_PLAYER_WIDTH = Math.floor(0.04802 * renderer.width);

// obstacle movement
var maxovel = [0, 5, 6, 6, 7, 7, 8, 8, 9, 10, 12];
var minovel = [0, 4, 4, 3, 3, 3, 3, 3, 4, 5, 5];

// spawn rates
//var minSpawnRate = [0, 200, 200, 200, 200, 150, 150, 150, 100, 100, 100];
//var maxSpawnRate = [0, 700, 700, 600, 600, 600, 600, 500, 500, 500, 500];
var minSpawnRate = [0, 400, 350, 300, 250, 200, 200, 150, 150, 100, 100];
var maxSpawnRate = [0, 1000, 900, 700, 700, 650, 650, 600, 600, 550, 500];

// number of obstacles needed to pass to advance to the next level. currently 10 levels max
var levelObstacles = [0, 25, 50, 100, 150, 200, 250, 300, 400, 500, 1000];
// obstacles colors based on level
var obstacleColors = [0x000000, 0xF4D03F, 0x2ECC71, 0X3498DB, 0X8E44AD, 0X2C3E50, 0XECF0F1, 0XE67E22, 0XFA8072, 0XFE2EF7, 0X190707];
/* -------------- END constants -------------- */



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

	// creates the info bar containing lives, level, etc
	createInfoBar();

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
		if (spacePressed()) {
			// start level 1
			startGame();
		}
	// game is not over, continue letting user move the player
	} else {
		updateBackground();
		updateInfoBar();

		// pauses player and obstacles if a level was just lost
		if (!recentlyLostLife) {
			updateScreenObjects();
		}

		// just completed a level
		if (recentlyCompletedLevel) {
			// move to the next level only if all obstacles are clear
			if (spacePressed() && obstacles.length === 0) {
				nextLevel();
			}
		}
	}
}

function updateScreenObjects() {
	// handle player movement
	updatePlayer(player);
	if (player.twin) {
		updatePlayer(player.twinSprite);
	}

	// move obstacles
	updateObstacles();

	// move powerups
	updatePowerUps();

	// move lasers
	updateLasers();
}

function updateBackground() {
	far.tilePosition.y += 0.5;
}

function updateInfoBar() {
	console.log("updating info bar");
	infoBar.parent.addChild(infoBar);

	lifeSprites.forEach(function(lifeSprite) {
		lifeSprite.parent.addChild(lifeSprite);
	});
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
	clearPowerUps();
	clearLasers();
	recentlyLostLife = false;

	if (!checkCompletedLevel()) {
		resetPlayerValues(player);

		recentlyCompletedLevel = false;
		spawnObstacle();
	}
}

function resetPlayerValues(p) {
	resetPlayerSize(p);
	resetPlayerPosition(p);
	resetPlayerVelocity(p);
	resetPlayerPowerUps(p);
}

function resetPlayerPosition(p) {
	// centers player since the x,y are in the top left corner
	p.x = renderer.width / 2 - p.width / 2;
	p.y = SCREEN_BOTTOM / 2 - p.height / 2;
}

function resetPlayerVelocity(p) {
	p.xv = 0;
	p.yv = 0;
}

function resetPlayerSize(p) {
	p.height = DEFAULT_PLAYER_HEIGHT;
	p.width = DEFAULT_PLAYER_WIDTH;
}

function resetPlayerPowerUps(p) {
	p.lasers = false;
	if (p.twin) {
		p.twin = false;
		stage.removeChild(player.twinSprite);
	}
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
function spacePressed() {
	return keyPressed[SPACE];
}

function updatePlayer(p) {
	// updates velocities based on our accel/deceleration values
	// so the player's movement is smoother
	// W
	if (p.upPressed()) {
		// accelerate in the negative y direction
		if (p.yv > MINPVEL) {
			p.yv -= ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!p.downPressed() && p.yv < 0) {
			p.yv += DECELERATION;
		}
	}

	// A
	if (p.leftPressed()) {
		// accelerate in the negative x direction
		if (p.xv > MINPVEL) {
			p.xv -= ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!p.rightPressed() && p.xv < 0) {
			p.xv += DECELERATION;
		}
	}

	// S
	if (p.downPressed()) {
		// accelerate in the positive y direction
		if (p.yv < MAXPVEL) {
			p.yv += ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!p.upPressed() && p.yv > 0) {
			p.yv -= DECELERATION;
		}
	}

	// D
	if (p.rightPressed()) {
		// accelerate in the positive x direction
		if (p.xv < MAXPVEL) {
			p.xv += ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!p.leftPressed() && p.xv > 0) {
			p.xv -= DECELERATION;
		}
	}

	// SPACE
	if (spacePressed()) {
		// shoot lasers if the player has them
		if (canShootLaser()) {
			shootLaser();
		}
	}

	// updates position
	p.x += p.xv;
	p.y += p.yv;

	// maintains bounds
	maintainBounds(p);
}

function canShootLaser() {
	return player.lasers && !recentlyShotLaser;
}

function updateObstacles() {
	obstacles.forEach(function(obstacle) {
		// render obstacle
		obstacle.move();
		obstacle.rotation += obstacle.rotationSpeed;

		// removes obstacle if its off the screen
		// checks obstacle collisions
		checkObstacleBounds(obstacle);
	});
}

function updatePowerUps() {
	powerUps.forEach(function(powerUp) {
		// render powerup
		powerUp.move();

		// removes powerup if it's off the screen
		checkPowerUpBounds(powerUp);		
	});
}

function updateLasers() {
	lasers.forEach(function(laser) {
		laser.move();

		// checks if it's flown off the screen
		checkLaserBounds(laser);
	})
}

function clearScreen() {
	// even after removing from screen, the button still is clickable
	// for now, move it completely off the screen
	startButton.x = -500;
	startButton.y = -500;

	// remove message and player
	stage.removeChild(mainMessage);
	stage.removeChild(startButton);
	stage.removeChild(levelMessage);
	stage.removeChild(obstacleMessage);
	stage.removeChild(player);

	clearObstacles();
	clearPowerUps();
	clearLasers();
}

function removeLifeSprite() {
	lifeSprites.pop();
}

function removeObstacle(obstacle) {
	// removes obstacle from our internal list and from the screen
	let index = obstacles.indexOf(obstacle);
	obstacles.splice(index, 1);
	stage.removeChild(obstacle);
}

function removePowerUp(powerUp) {
	// removes powerup from our internal list and the screen
	let index = powerUps.indexOf(powerUp);
	powerUps.splice(index, 1);
	stage.removeChild(powerUp);
}

function removeLaser(laser) {
	let index = lasers.indexOf(laser);
	lasers.splice(index, 1);
	stage.removeChild(laser);
}

function clearObstacles() {
	obstacles.forEach(function(obstacle) {
		stage.removeChild(obstacle);
	});
	obstacles = [];
}

function clearPowerUps() {
	powerUps.forEach(function(powerUp) {
		stage.removeChild(powerUp);
	});
	powerUps = [];
}

function clearLasers() {
	lasers.forEach(function(laser) {
		stage.removeChild(laser);
	});
	lasers = [];
}

function incrementLevelCount() {
	level++;
	updateLevelMessage();
}

function decrementLifeCount() {
	lives--;
	
	// remove life sprite and render
	removeLifeSprite();
	updateInfoBar();
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

		// tries random number to see if a power up should be spawned
		trySpawnPowerUp();

		// spawns another obstacle in a random time
		let t = randomSpawnTime();
		setTimeout(spawnObstacle, t);
	}
}

function trySpawnPowerUp() {
	// generates random number to see if power up
	// should be spawned
	let rand = Math.floor(Math.random() * POWERUP_SPAWNRATE);

	// lucky number
	if (rand === 7) {
		createPowerUp();
	}
}

function choosePowerUpType() {
	//return 3;
	return Math.floor(Math.random() * NUM_POWERUPS);
}

function chooseSpawnLocationIndex() {
	// possible spawn locations
	let poss = [];

	// gets all possible spawn location indices
	let i;
	for (i = 0; i < OBSTACLE_LOCATIONS; i++) {
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
	return !gameOver 
		&& !recentlyLostLife 
		&& !recentlyCompletedLevel 
		&& obstaclesSpawned < levelObstacles[level];
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

function maintainBounds(p) {
	// keeps player inside the game screen. resets its velocity if it hits a wall

	// player tries to leave from the top
	if (p.y < SCREEN_TOP) {
		p.y = SCREEN_TOP;
		p.yv = 0;
	}

	// player tries to leave from the left
	if (p.x < 0) {
		p.x = 0;
		p.xv = 0;
	}

	// player tries to leave from the bottom
	if (p.y > SCREEN_BOTTOM - p.height) {
		p.y = SCREEN_BOTTOM - p.height;
		p.yv = 0;
	}

	// player tries to leave from the right
	if (p.x > renderer.width - p.width) {
		p.x = renderer.width - p.width;
		p.xv = 0;
	}
}

function playerCircleCollision(p, o) {
	// detects collision between player rocket and circle
	// splits player up into two hitboxes
	// checks if either of those collide with the circle hitbox
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
		radius : o.radius
	};

	return hitTestRectCircle(verticalHitbox, obstacleHitbox) 
		|| hitTestRectCircle(horizontalHitbox, obstacleHitbox);
}

function obstacleCollision(obstacle) {
	// player or its twin (if active) hit an obstacle
	return playerCircleCollision(player, obstacle)
		|| (player.twin && playerCircleCollision(player.twinSprite, obstacle));
}

function checkObstacleBounds(obstacle) {
	// player hit the obstacle
	if (obstacleCollision(obstacle)) {
		loseLife();
	} else if (objectOutOfRange(obstacle)) {
		// obstacle has left the screen, remove it
		removeObstacle(obstacle);

		// update text
		incrementObstaclesPassed();

		// checks if the level has been completed
		checkCompletedLevel();
	}
}

function checkLaserBounds(laser) {
	// laser hit an obstacle, we removed it
	if (laserHitObstacle(laser)) {
		incrementObstaclesPassed();
	} else if (laserOutOfRange(laser)) {
		// left the screen, remove it
		removeLaser(laser);
	}
}

function laserHitObstacle(laser) {
	let hit = false;

	obstacles.forEach(function(obstacle) {
		if (hitTestRectCircle(laser, obstacle)) {
			removeLaser(laser);
			removeObstacle(obstacle);
			hit = true;
		}
	});

	return hit;
}

function checkPowerUpBounds(powerUp) {
	if (playerCircleCollision(player, powerUp)) {
		// do what power up do
		consumePowerUp(powerUp);
	} else if (objectOutOfRange(powerUp)) {
		removePowerUp(powerUp);
	}
}

function consumePowerUp(powerUp) {
	// remove it from our internal list and the screen
	removePowerUp(powerUp);

	// executes power up depending on type
	switch(powerUp.type) {
		case PowerUpType.HALFSIZE:
			halfPlayerSize();
			break;
		case PowerUpType.DOUBLESIZE:
			doublePlayerSize();
			break;
		case PowerUpType.LASERS:
			addPlayerLasers();
			break;
		case PowerUpType.TWIN:
			addTwin();
			break;
	}

	// power up only lasts for a certain amount of time
	setTimeout(function () {
		resetPlayerPowerUp(powerUp.type);
	}, POWERUP_DURATION);
}

function resetPlayerPowerUp(type) {
	if (type === PowerUpType.HALFSIZE) {
		// we want to reset it but only if it hasn't already been reset
		if (player.width < DEFAULT_PLAYER_WIDTH 
			&& player.height < DEFAULT_PLAYER_HEIGHT) {
			doublePlayerSize();
		}
	} else if (type === PowerUpType.DOUBLESIZE) {
		if (player.width > DEFAULT_PLAYER_WIDTH
			&& player.height > DEFAULT_PLAYER_HEIGHT) {
			halfPlayerSize();
		}
	} else if (type === PowerUpType.LASERS) {
		player.lasers = false;
	} else if (type === PowerUpType.TWIN) {
		player.twin = false;
		stage.removeChild(player.twinSprite);
	}
}

function addPlayerLasers() {
	player.lasers = true;
}

function addTwin() {
	// only can have one twin
	if (!player.twin) {
		player.twin = true;
		player.twinSprite.x = player.x;
		player.twinSprite.y = player.y;
		stage.addChild(player.twinSprite);
	}
}

function halfPlayerSize() {
	// temporarily sets player anchor to center
	// so the size change is centered, then resets
	// TODO NOT SURE IF THIS ACTUALLY HELPS --------------------------------
	player.height = player.height / 2;
	player.width = player.width / 2;
}

function doublePlayerSize() {
	player.height = player.height * 2;
	player.width = player.width * 2;
}

function laserOutOfRange(laser) {
	return laser.y + laser.height < SCREEN_TOP;
}

function objectOutOfRange(obstacle) {
	return obstacle.y > SCREEN_BOTTOM + obstacle.height;
}
/* -------------- END collision -------------- */



/* -------------- BEGIN constructors -------------- */
function constructSpawnLocations() {
	let i = 0;
	let obstacleRad = Math.floor(0.04802 * renderer.width);

	// divides screen into OBSTACLE_LOCATIONS number of slots
	for (i = 0; i < OBSTACLE_LOCATIONS; i++) {
		let loc = Math.floor((renderer.width / OBSTACLE_LOCATIONS) * i) + obstacleRad;
		spawnLocations.push(loc);
		canSpawn.push(true);
	}
}

function createInfoBar() {
	// creates the graphics object
	infoBar = new Graphics();

	// sets its values
	infoBar.beginFill(0x000000);
	infoBar.drawRect(0,SCREEN_BOTTOM,renderer.width,renderer.height);
	infoBar.endFill();

	// add info bar text and sprites
	createInfoBarSprites();

	console.log("Adding info bar to stage");
	// adds it to the screen
	stage.addChild(infoBar);
}

function createInfoBarSprites() {
	createLifeSprites();
	//createObstacleMessage();
	//createLevelMessage();
}

function createLifeSprites() {
	// adds 3 life sprites
	let i;
	for (i = 0; i < lives; i++) {
		let lifeSprite = new Sprite(
			loader.resources["img/rocket.png"].texture
		);

		lifeSprite.height = INFO_BAR_HEIGHT - BORDER_SIZE;
		lifeSprite.width = lifeSprite.height * (600/872);

		lifeSprite.x = i * lifeSprite.width + i*BORDER_SIZE;
		lifeSprite.y = SCREEN_BOTTOM + BORDER_SIZE;

		lifeSprite.visible = true;

		lifeSprites.push(lifeSprite);

		stage.addChild(lifeSprite);
	}
}

function createPlayer() {
	player = new Sprite(
		loader.resources["img/rocket.png"].texture
	);

	player.upPressed = function () {
		return keyPressed[WCODE];
	}

	player.rightPressed = function() {
		return keyPressed[DCODE];
	}

	player.leftPressed = function() {
		return keyPressed[ACODE];
	}

	player.downPressed = function() {
		return keyPressed[SCODE];
	}

	player.twinSprite = createTwinSprite();

	// puts player in the middle of the screen
	resetPlayerValues(player);

	// add player to screen
	stage.addChild(player);
}

function createTwinSprite() {
	let twin = new Sprite(
		loader.resources["img/rocket.png"].texture
	);

	twin.upPressed = function() {
		return keyPressed[UARROW];
	}

	twin.rightPressed = function() {
		return keyPressed[RARROW];
	}

	twin.leftPressed = function() {
		return keyPressed[LARROW];
	}

	twin.downPressed = function() {
		return keyPressed[DARROW];
	}

	// resets twin's values but puts it on top of player
	resetPlayerValues(twin);

	twin.tint = 0x7F8C8D;

	// doesn't yet add it to the screen
	return twin;

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
	obstacle.radius = oside * 0.8;

	obstacle.anchor.x = 0.5;
	obstacle.anchor.y = 0.5;

	obstacle.rotationSpeed = Math.random()*0.1+0.02;

	// sets the obstacle position
	obstacle.x = spawnLocations[ri];
	obstacle.y = SCREEN_TOP - obstacle.height;

	// adds obstacle movement
	obstacle.speed = randomObstacleSpeed();
	obstacle.move = function() {
		obstacle.y += obstacle.speed;
	}

	// add obstacle to the list
	obstacles.push(obstacle);

	// add obstacle to the stage
	stage.addChild(obstacle);
}

// creates a laser object
function shootLaser() {
	// creates a laser object
	let laser = new Graphics();

	laser.beginFill(0xE74C3C);
	laser.drawRect(0,0,player.width/5, player.height/10);
	laser.endFill();

	laser.x = player.x + laser.width * 2;
	laser.y = player.y - laser.height;

	laser.speed = LASER_SPEED;
	laser.move = function() {
		laser.y -= laser.speed;
	}

	recentlyShotLaser = true;
	setTimeout( function() { recentlyShotLaser = false; }, 300);

	lasers.push(laser);

	stage.addChild(laser);
}

function createPowerUp() {
	// chooses a random spawn location of the available locations
	let ri = chooseSpawnLocationIndex();
	// no available locations at the moment
	if (ri === -1) {
		return;
	}

	// creates the graphics object
	let powerUp = new Graphics();

	// decides on the type of powerup
	powerUp.type = choosePowerUpType();

	// construct the physical features
	powerUp.radius = 20;
	powerUp.beginFill(0xf08080);
	powerUp.drawCircle(0,0,powerUp.radius);
	powerUp.endFill();
	powerUp.x = spawnLocations[ri];
	powerUp.y = SCREEN_TOP - powerUp.radius;

	powerUp.speed = 3;
	powerUp.move = function() {
		powerUp.y += powerUp.speed;
	}

	// add powerup to the list
	powerUps.push(powerUp);

	// add power up to the stage
	stage.addChild(powerUp);
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
	mainMessage.y = SCREEN_BOTTOM / 2;

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
	levelMessage.x = BORDER_SIZE;
	levelMessage.y = BORDER_SIZE;

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
	obstacleMessage.x = BORDER_SIZE;
	obstacleMessage.y = levelMessage.y + levelMessage.height + BORDER_SIZE;

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

	startButton.height = Math.floor(0.15495 * SCREEN_BOTTOM);//150;
	startButton.width = Math.floor(0.18007 * renderer.width);//300;
	startButton.anchor.x = 0.5;
	startButton.anchor.y = 0.5;
	startButton.x = renderer.width / 2;
	startButton.y = SCREEN_BOTTOM / 2;

	startButton.release = () => {
		startGame();
	}

	stage.addChild(startButton);
}

function createMessageSprites() {
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