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
// keeps track of game version
var twoPlayer = false;
// current level
var level = 0;
// lives left
var lives = 3;
var p2lives = 3;
// current obstacles allowed to pass
var obstaclesPassed = 0;
// current obstacles that have been spawned
var obstaclesSpawned = 0;
// main player sprite
var player;
var player2;
// panning background
var far;
// main menu start button
var startButton;

var onePlayerButton;
var twoPlayerButton;
var logo;
// information bar
var infoBar;
// text sprite displayed to the user
var mainMessage = "";
// text sprite handling current level
var levelMessage = "";
// text sprite handling obstacle count
var obstacleMessage;
var obstacleMessageLogo;
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
var p2lifeSprites = [];
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
var LCODE = 76;
var LARROW = 37;
var RARROW = 39;
var UARROW = 38;
var DARROW = 40;
var SPACE = 32;
var SLASH = 191;

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
var maxovel = [5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 12];
var minovel = [4, 4, 4, 3, 3, 3, 3, 3, 4, 5, 5];

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

	// creates player sprite so user can control rocket
	// while waiting to start the game
	createPlayer();

	// kick off game loop
	gameLoop();
	//setInterval(gameLoop, 10);
}

function gameLoop() {
	// loop the game 60 times a second
	requestAnimationFrame(gameLoop);

	// handles user input
	handleUserInput();
	//play();

	// update tink for button
	// could improve render speed by not updating tink when no button is displayed
	t.update();

	// renders the content on the screen
	renderer.render(stage);
}

function handleUserInput() {
	if (gameOver) {
		// start the game over
		// if (spacePressed()) {
		// 	// start level 1
		// 	twoPlayer = false;
		// 	startGame();
		// } else if (keyPressed[WCODE]) {
		// 	twoPlayer = true;
		// 	startGame();
		// }	
		if (spacePressed()) {
			startGame();
		}

		updatePlayers();
		updateMenu();
	} else {
		play();
	}
}

function start1Player() {
	twoPlayer = false;
	startGame();
}

function start2Player() {
	twoPlayer = true;
	startGame();
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
	if (twoPlayer) {
		createPlayer2();
	}

	// begins spawning obstacles in 1 sec
	setTimeout(spawnObstacle, 1000);
}

function play() {
	updateBackground();
	updateInfoBar();

	if (twoPlayer) {
		updateScreenObjects();
	} else {
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

function updateMenu() {
	// updates menu objects so the player flies under them
	if (logo.parent) {
		logo.parent.addChild(logo);
		onePlayerButton.parent.addChild(onePlayerButton);
		twoPlayerButton.parent.addChild(twoPlayerButton);
	}
}

function updateScreenObjects() {
	// handle player movement
	updatePlayers();

	// move obstacles
	updateObstacles();

	// move powerups
	updatePowerUps();

	// move lasers
	updateLasers();
}

function updatePlayers() {
	updatePlayer(player);
	if (player.twin) {
		updatePlayer(player.twinSprite);
	}

	if (twoPlayer) {
		updatePlayer(player2);
	}
}

function updateBackground() {
	far.tilePosition.y += 0.5;
}

function updateInfoBar() {
	infoBar.parent.addChild(infoBar);

	lifeSprites.forEach(function(lifeSprite) {
		if (lifeSprite.parent) {
			lifeSprite.parent.addChild(lifeSprite);
		}
	});

	if (twoPlayer) {
		p2lifeSprites.forEach(function(lifeSprite) {
			if (lifeSprite.parent) {
				lifeSprite.parent.addChild(lifeSprite);
			}
		});
	} else {
		obstacleMessage.parent.addChild(obstacleMessage);
		obstacleMessageLogo.parent.addChild(obstacleMessageLogo);
	}

	//levelMessage.parent.addChild(levelMessage);
}

function resetGameState() {
	gameOver = false;
	recentlyLostLife = false;
	recentlyCompletedLevel = false;

	lives = 3;

	if (twoPlayer) {
		p2lives = 3;
	} else {
		level = 1;
		obstaclesPassed = 0;
		obstaclesSpawned = 0;
	}
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

	// restarting the life
	recentlyLostLife = false;

	// clears the screen objects
	removePowerUpObjects();

	// resets player size, powerups, and position
	resetPlayerValues(player);

	// kicks off new obstacles
	spawnObstacle();
}

function resetPlayerValues(p) {
	p.resetSize();
	p.resetPosition();
	p.resetVelocity();
	p.resetPowerUps();
	//resetPlayerPowerUps(p);
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
	if (twoPlayer) {
		p.height = DEFAULT_PLAYER_WIDTH;
		p.width = DEFAULT_PLAYER_HEIGHT;
	} else {
		p.height = DEFAULT_PLAYER_HEIGHT;
		p.width = DEFAULT_PLAYER_WIDTH;
	}
}

function resetPlayerPowerUps(p) {
	if (!twoPlayer) {
		p.lasers = false;
		if (p.twin) {
			p.twin = false;
			stage.removeChild(player.twinSprite);
		}
	}

	resetPlayerSize(p);
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

		// takes away all power ups from player
		resetPlayerPowerUps(player);

		createText("Level "+level+" complete! Press space to advance to the next level");
	}
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
	if (p.shootPressed()) {
		// shoot lasers if the player has them
		if (p.canShootLaser()) {
			p.shootLaser();
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
	//startButton.x = -500;
	//startButton.y = -500;

	onePlayerButton.x = -500;
	onePlayerButton.y = -500;
	twoPlayerButton.x = -500;
	twoPlayerButton.y = -500;
	logo.x = -500;
	logo.y = -500;

	// remove message and player
	stage.removeChild(mainMessage);
	//stage.removeChild(startButton);
	//stage.removeChild(onePlayerButton);
	//stage.removeChild(twoPlayerButton);
	stage.removeChild(levelMessage);
	stage.removeChild(obstacleMessage);
	stage.removeChild(obstacleMessageLogo);
	stage.removeChild(player);
	if (twoPlayer) {
		stage.removeChild(player2);
	}

	lifeSprites.forEach(function(lifeSprite) {
		stage.removeChild(lifeSprite);
	});
	p2lifeSprites.forEach(function(lifeSprite) {
		stage.removeChild(lifeSprite);
	});

	removePowerUpObjects();
}

function removeLifeSprite() {
	lifeSprites.pop();
}

function removeLifeSpritep2() {
	p2lifeSprites.pop();
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

function removePowerUpObjects() {
	clearObstacles();
	clearPowerUps();
	clearLasers();
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

	if (twoPlayer && lives === 0) {

		createText("Player 2 wins!!");
		gameOver = true;
	}
}

function decrementLifeCountp2() {
	p2lives--;

	// remove life sprite and render
	removeLifeSpritep2();
	updateInfoBar();

	if (twoPlayer && p2lives === 0) {
		createText("Player 1 wins!!");
		gameOver = true;
	}
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
		createObstacle();

		if (twoPlayer) {
			// consistent spawn time for two player
			setTimeout(spawnObstacle, 1000);
		} else {
			// creates and adds an obstacle to the screen
			obstaclesSpawned++;

			// tries random number to see if a power up should be spawned
			trySpawnPowerUp();

			// spawns another obstacle in a random time
			let t = randomSpawnTime();
			setTimeout(spawnObstacle, t);
		}
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
	let r = Math.floor(Math.random() * (max-min+1)) + min;
	return r;
}

function randomSpawnTime() {
	let max = maxSpawnRate[level];
	let min = minSpawnRate[level];
	return Math.floor(Math.random() * (max-min+1)) + min;
}

function canSpawnObstacle() {
	if (twoPlayer) {
		return !gameOver;
	} else {
		return !gameOver 
			&& !recentlyLostLife 
			&& !recentlyCompletedLevel 
			&& obstaclesSpawned < levelObstacles[level];
	}
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
	if (twoPlayer) {
		if (obstacleHitPlayer(obstacle)) {
			resetPlayerValues(player);
			player.x = renderer.width * (1/4);
			decrementLifeCount();
		}
		if (obstacleHitPlayer2(obstacle)) {
			resetPlayerValues(player2);
			player2.x = renderer.width * (3/4);
			decrementLifeCountp2();
		}
	} else {
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
}

function checkLaserBounds(laser) {
	// laser hit an obstacle, we removed it
	if (laserHitObstacle(laser)) {
		if (!twoPlayer) {
			incrementObstaclesPassed();
		}
	} else if (laserOutOfRange(laser)) {
		// left the screen, remove it
		removeLaser(laser);
	} 

	if (twoPlayer) {
		if (laserHitPlayer(laser)) {
			resetPlayerValues(player);
			decrementLifeCount();
		} else if (laserHitPlayer2(laser)) {
			resetPlayerValues(player2);
			decrementLifeCountp2();
		}
	}
}

function obstacleHitPlayer(obstacle) {
	let verticalHitbox = {
		height : player.height,
		width : player.width / 3,
		x : player.x,
		y : player.y
	};

	let horizontalHitbox = {
		height : player.height / 3,
		width : player.width,
		x : player.x,
		y : player.y + player.height * 1 / 3
	};

	let obstacleHitbox = {
		x : obstacle.x,
		y : obstacle.y,
		radius : obstacle.radius
	};

	return hitTestRectCircle(verticalHitbox, obstacleHitbox) 
		|| hitTestRectCircle(horizontalHitbox, obstacleHitbox);
}

function obstacleHitPlayer2(obstacle) {
	let verticalHitbox = {
		height : player2.height,
		width : player2.width / 3,
		x : player2.x + player2.width * 2 / 3,
		y : player2.y
	};

	let horizontalHitbox = {
		height : player2.height / 3,
		width : player2.width,
		x : player2.x,
		y : player2.y + player2.height * 1 / 3
	};

	let obstacleHitbox = {
		x : obstacle.x,
		y : obstacle.y,
		radius : obstacle.radius
	};

	return hitTestRectCircle(verticalHitbox, obstacleHitbox) 
		|| hitTestRectCircle(horizontalHitbox, obstacleHitbox);
}

function laserHitPlayer(laser) {
	let verticalHitbox = {
		height : player.height,
		width : player.width / 3,
		x : player.x,
		y : player.y
	};

	let horizontalHitbox = {
		height : player.height / 3,
		width : player.width,
		x : player.x,
		y : player.y + player.height * 1 / 3
	};

	if (hitTestRectangle(verticalHitbox, laser) || hitTestRectangle(horizontalHitbox, laser)) {
		removeLaser(laser);
		return true;
	}

	return false;
}

function laserHitPlayer2(laser) {
	let verticalHitbox = {
		height : player2.height,
		width : player2.width / 3,
		x : player2.x + player2.width * 2 / 3,
		y : player2.y
	};

	let horizontalHitbox = {
		height : player2.height / 3,
		width : player2.width,
		x : player2.x,
		y : player2.y + player2.height * 1 / 3
	};

	if (hitTestRectangle(verticalHitbox, laser) || hitTestRectangle(horizontalHitbox, laser)) {
		removeLaser(laser);
		return true;
	}

	return false;
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
	if (twoPlayer) {
		return (laser.x + laser.width < 0) || (laser.x - laser.width > renderer.width);
	} else {
		return laser.y + laser.height < SCREEN_TOP;
	}
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

	// adds it to the screen
	stage.addChild(infoBar);
}

function createInfoBarSprites() {
	createLifeSprites();

	if (!twoPlayer) {
		createObstacleMessage();
	}
	//createLevelMessage();
}

function createLifeSprites() {
	// adds 3 life sprites
	let i;
	for (i = 0; i < lives; i++) {
		let lifeSprite;

		lifeSprite = new Sprite(
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

	if (twoPlayer) {
		for (i = 0; i < p2lives; i++) {
			let lifeSprite = new Sprite(
				loader.resources["img/rocket.png"].texture
			);

			lifeSprite.height = INFO_BAR_HEIGHT - BORDER_SIZE;
			lifeSprite.width = lifeSprite.height * (600/872);

			lifeSprite.x = renderer.width - ((i+1) * lifeSprite.width + i*BORDER_SIZE);
			lifeSprite.y = SCREEN_BOTTOM + BORDER_SIZE;

			lifeSprite.visible = true;

			p2lifeSprites.push(lifeSprite);

			stage.addChild(lifeSprite);
		}
	}
}

function createPlayer() {
	if (twoPlayer) {
		player = new Sprite(
			loader.resources["img/rocket_right.png"].texture
		);
	} else {
		player = new Sprite(
			loader.resources["img/rocket.png"].texture
		);	
	}

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

	player.shootPressed = function() {
		return keyPressed[SPACE];
	}

	player.canShootLaser = function() {
		return player.lasers && !player.recentlyShotLaser && !gameOver;
	}

	player.shootLaser = function() {
		if (twoPlayer) {
			// small buffer to avoid player colliding with own laser
			let x = player.x + player.width + 5;
			let y = player.y + player.height * (4/10);
			spawnLaser(player, -1*LASER_SPEED, x, y);
		} else {
			let x = player.x + player.width * (2/5);
			let y = player.y - player.height * (1/10);
			spawnLaser(player, LASER_SPEED, x, y);
		}

		player.recentlyShotLaser = true;
		setTimeout( function() { player.recentlyShotLaser = false; }, 300);
	}

	player.resetPosition = function() {
		if (twoPlayer) {
			player.x = renderer.width * (1/4);
		} else {
			player.x = renderer.width / 2;
		}

		player.y = SCREEN_BOTTOM / 2;
	}

	player.resetVelocity = function() {
		player.xv = 0;
		player.yv = 0;
	}

	player.resetSize = function() {
		if (twoPlayer) {
			player.height = DEFAULT_PLAYER_WIDTH;
			player.width = DEFAULT_PLAYER_HEIGHT;
		} else {
			player.height = DEFAULT_PLAYER_HEIGHT;
			player.width = DEFAULT_PLAYER_WIDTH;
		}
	}

	player.resetPowerUps = function() {
		if (!twoPlayer) {
			player.lasers = false;
			if (player.twin) {
				player.twin = false;
				stage.removeChild(player.twinSprite);
			}
		}

		player.resetSize();
	}

	if (twoPlayer) {
		player.lasers = true;
	}
	player.recentlyShotLaser = false;

	player.twinSprite = createTwinSprite();

	// turns off lasers and twin
	//resetPlayerPowerUps(player);
	resetPlayerValues(player);
	if (twoPlayer) {
		player.x = renderer.width * (1/4);
	}

	// add player to screen
	stage.addChild(player);
}

function createPlayer2() {
	player2 = new Sprite(
		loader.resources["img/rocket_left.png"].texture
	);

	player2.upPressed = function () {
		return keyPressed[UARROW];
	}

	player2.rightPressed = function() {
		return keyPressed[RARROW];
	}

	player2.leftPressed = function() {
		return keyPressed[LARROW];
	}

	player2.downPressed = function() {
		return keyPressed[DARROW];
	}

	player2.shootPressed = function() {
		return keyPressed[SLASH];
	}

	player2.canShootLaser = function() {
		return !player2.recentlyShotLaser && !gameOver;
	}

	player2.shootLaser = function() {
		// small buffer to avoid player colliding with own laser
		let x = player2.x - player2.width/5 - 30;
		let y = player2.y + player2.height * (4/10);
		spawnLaser(player2, LASER_SPEED, x, y);

		player2.recentlyShotLaser = true;
		setTimeout( function() { player2.recentlyShotLaser = false; }, 300);
	}

	player2.resetPosition = function() {
		player2.x = renderer.width * (3/4);
		player2.y = SCREEN_BOTTOM / 2;
	}

	player2.resetVelocity = function() {
		player2.xv = 0;
		player2.yv = 0;
	}

	player2.resetSize = function() {
		player2.height = DEFAULT_PLAYER_WIDTH;
		player2.width = DEFAULT_PLAYER_HEIGHT;
	}

	player2.resetPowerUps = function() {
		player2.resetSize();
	}

	player2.lasers = true;
	player2.recentlyShotLaser = false;

	// puts player in the middle of the screen
	resetPlayerValues(player2);
	player2.x = renderer.width * (3/4);

	// add player to screen
	stage.addChild(player2);
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

	twin.shootPressed = function() {
		return keyPressed[SPACE];
	}

	twin.resetPosition = function() {
		twin.x = player.x;
		twin.y = player.y;
	}

	twin.resetVelocity = function() {
		twin.xv = 0;
		twin.yv = 0;
	}

	twin.resetSize = function() {
		twin.height = DEFAULT_PLAYER_HEIGHT;
		twin.width = DEFAULT_PLAYER_WIDTH;
	}

	twin.resetPowerUps = function() {
		twin.resetSize();
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

function spawnLaser(p, speed, x, y) {
	// creates a laser object
	let laser = new Graphics();

	laser.beginFill(0xE74C3C);
	laser.drawRect(0,0,p.width/5, p.height/10);
	laser.endFill();

	laser.x = x;
	laser.y = y;

	laser.speed = speed;
	laser.move = function() {
		if (twoPlayer) {
			laser.x -= laser.speed;
		} else {
			laser.y -= laser.speed;
		}
	}

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
			fontSize: 50,
			fill: "white"
		}
	);

	// set text position
	levelMessage.x = obstacleMessage.x + obstacleMessage.width + BORDER_SIZE*3;//BORDER_SIZE;
	levelMessage.y = SCREEN_BOTTOM + BORDER_SIZE;//levelMessage.y + levelMessage.height + BORDER_SIZE;
	levelMessage.height = lifeSprites[2].height;
	levelMessage.width = levelMessage.height * 2;

	// adds it to the stage
	stage.addChild(levelMessage);
}

function createObstacleMessage() {
	// creates the text sprite
	obstacleMessage = new Text(obstaclesPassed + "/" + levelObstacles[level],
		{
			fontFamily: "Arial",
			fontSize: 50,
			fill: "white"
		}	
	);

	// set text position
	obstacleMessage.x = lifeSprites[2].x + lifeSprites[2].width + BORDER_SIZE*6;//BORDER_SIZE;
	obstacleMessage.y = SCREEN_BOTTOM + BORDER_SIZE;//levelMessage.y + levelMessage.height + BORDER_SIZE;
	obstacleMessage.height = lifeSprites[2].height;
	obstacleMessage.width = obstacleMessage.height * 1.6;

	// add it to the stage
	stage.addChild(obstacleMessage);

	// asteroid picture next to obstacle count
	obstacleMessageLogo = new Sprite(
		loader.resources["img/asteroid.png"].texture
	);
	obstacleMessageLogo.x = obstacleMessage.x + obstacleMessage.width + BORDER_SIZE;
	obstacleMessageLogo.y = SCREEN_BOTTOM + BORDER_SIZE;
	obstacleMessageLogo.height = obstacleMessage.height * 0.9;
	obstacleMessageLogo.width = obstacleMessage.height;

	stage.addChild(obstacleMessageLogo);
}

function createLogo() {
	logo = new Sprite(
		loader.resources["img/rocketboi.png"].texture
	);

	logo.anchor.x = 0.5;
	logo.anchor.y = 0.5;
	logo.x = renderer.width / 2;
	logo.y = SCREEN_BOTTOM * (2 / 5);

	stage.addChild(logo);
}

function create1PlayerButton() {
	let up = PIXI.loader.resources["img/one_player_up.png"].texture;
	let down = PIXI.loader.resources["img/one_player_down.png"].texture;
	let over = PIXI.loader.resources["img/one_player_over.png"].texture;

	let buttonFrames = [
    	up,
    	over,
    	down
	];

	onePlayerButton = t.button(buttonFrames);

	onePlayerButton.height = Math.floor(0.15495 * SCREEN_BOTTOM);//150;
	onePlayerButton.width = Math.floor(0.18007 * renderer.width);//300;
	onePlayerButton.anchor.x = 0.5;
	onePlayerButton.anchor.y = 0.5;
	onePlayerButton.x = renderer.width / 2 - (onePlayerButton.width / 2 + 20); // 20 is small buffer
	onePlayerButton.y = SCREEN_BOTTOM * (4 / 5);

	onePlayerButton.release = () => {
		start1Player();
	}

	stage.addChild(onePlayerButton);
}

function create2PlayerButton() {
	let up = PIXI.loader.resources["img/two_players_up.png"].texture;
	let down = PIXI.loader.resources["img/two_players_down.png"].texture;
	let over = PIXI.loader.resources["img/two_players_over.png"].texture;


	let buttonFrames = [
    	up,
    	over,
    	down
	];

	twoPlayerButton = t.button(buttonFrames);

	twoPlayerButton.height = Math.floor(0.15495 * SCREEN_BOTTOM);//150;
	twoPlayerButton.width = Math.floor(0.18007 * renderer.width);//300;
	twoPlayerButton.anchor.x = 0.5;
	twoPlayerButton.anchor.y = 0.5;
	twoPlayerButton.x = renderer.width / 2 + (twoPlayerButton.width / 2 + 20); // 20 is small buffer
	twoPlayerButton.y = SCREEN_BOTTOM * (4 / 5);

	twoPlayerButton.release = () => {
		start2Player();
	}

	stage.addChild(twoPlayerButton);
}

function createMainMenuButtons() {
	//createStartButton();
	createLogo();	
	create1PlayerButton();
	create2PlayerButton();
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
		  "img/rocket_left.png",
		  "img/rocket_right.png",
		  "img/one_player_up.png",
		  "img/one_player_down.png",
		  "img/one_player_over.png",
		  "img/two_players_up.png",
		  "img/two_players_down.png",
		  "img/two_players_over.png",
		  "img/rocketboi.png",
		  "img/asteroid.png",
		  "img/bg.png"])
	.on("progress", loadProgressHandler)
	.load(setup);
/* -------------- END script body -------------- */