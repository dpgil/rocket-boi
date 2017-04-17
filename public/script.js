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
var renderer = autoDetectRenderer(800, 600, {backgroundColor : 0x0a3e74});//0x195087});//0x808b96});
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
// current level
var level = 0;
// lives left
var lives = 3;
// main player sprite
var player;
// text sprite displayed to the user
var message = "";
// main menu start button
var startButton;
// text sprite handling user lives
var lifeMessage = "";
// list of obstacles blocking the player
var obstacles = [];
// keeps track of the game state
var gameOver = true;
// keeps track of recently lost life
var recentlyLostLife = false;

// number of obstacles to dodge per level
var obstacleLimit = [50];

// keep track of key presses
var keyPressed = [];
/* -------------- END game variables -------------- */


/* -------------- BEGIN constants -------------- */
// keycodes
var WCODE = 87;
var ACODE = 65;
var SCODE = 83;
var DCODE = 68;
var SPACE = 32;

// player movement
var MAXVEL = 5;
var MINVEL = -5;
var ACCELERATION = 0.5;
var DECELERATION = 0.25;
/* -------------- END constants -------------- */


/* -------------- BEGIN functions -------------- */
function setup() {
	console.log("Starting main menu");

	// show main menu "press space to play"
	//createText("Press space to play");
	addMainMenuButtons();

	// set game state to over 
	// waiting at the menu is not playing
	gameOver = true;

	// kick off game loop
	gameLoop();
	//setInterval(gameLoop, 10);
}

function addMainMenuButtons() {
	addStartButton();	
}

function addStartButton() {
	let id = PIXI.loader.resources["img/start_button.json"].textures;

	let buttonFrames = [
    	id[2],
    	id[1],
    	id[0]
	];

	startButton = t.button(buttonFrames);

	startButton.height = 150;
	startButton.width = 300;
	startButton.anchor.x = 0.5;
	startButton.anchor.y = 0.5;
	startButton.x = renderer.width / 2;
	startButton.y = renderer.height / 2;

	startButton.release = () => {
		// even after removing from screen, the button still is clickable
		// for now, move it completely off the screen
		startButton.x = -500;
		startButton.y = -500;
		clearScreen();
		startGame();
	}

	stage.addChild(startButton);
}

function gameLoop() {
	// loop the game 60 times a second
	requestAnimationFrame(gameLoop);

	// handles user input
	play();

	// update tink
	t.update();

	// renders the content on the screen
	renderer.render(stage);
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
		if (!recentlyLostLife) {
			// handle player movement
			updatePlayer();

			// move obstacles
			updateObstacles();
		}
	}
}

function clearScreen() {
	// remove message and player
	stage.removeChild(message);
	stage.removeChild(startButton);
	stage.removeChild(lifeMessage);
	stage.removeChild(player);

	clearObstacles();
}

function createPlayer() {
	// makes player a red squares
	player = new Graphics();

	// fills in the color
	player.beginFill(0xC0392B);
	player.drawRect(0, 0, 64, 64);
	player.endFill();

	// puts player in the middle of the screen
	resetPlayer();

	// add player to screen
	stage.addChild(player);
}

function createObstacle() {
	// creates the graphics object
	var obstacle = new Graphics();

	// initializes obstacle radius
	obstacle.radius = 64;

	// fills in the color
	obstacle.beginFill(0xF4D03F);
	obstacle.drawCircle(0, 0, obstacle.radius);
	obstacle.endFill();

	// sets obstacle position to random x
	let rx = Math.floor(Math.random() * renderer.width);
	obstacle.x = rx;
	obstacle.y = renderer.height + obstacle.radius;

	// adds obstacle movement
	obstacle.speed = MAXVEL;
	obstacle.moveUp = function() {
		obstacle.y -= obstacle.speed;
	}

	// add obstacle to the list
	obstacles.push(obstacle);

	// add obstacle to the stage
	stage.addChild(obstacle);
}

function spawnObstacle() {
	// if the game ends, but set timeout is still going to call this function
	// we want to ignore it so obstacles aren't added after the game ends
	if (!gameOver && !recentlyLostLife) {
		// creates and adds an obstacle to the screen
		createObstacle();

		// spawns another obstacle in a random time
		let rand = Math.floor(Math.random() * (500) + 200);
		setTimeout(spawnObstacle, rand);
	}
}

function createLifeMessage() {
	// creates the text sprite
	lifeMessage = new Text("Lives: 3", 
		{fontFamily: "Arial", 
		fontSize: 32, 
		fill: "white"}
	);

	// set text position
	lifeMessage.x = 7;
	lifeMessage.y = 7;

	// adds it to the stage
	stage.addChild(lifeMessage);
}

function updateLifeMessage() {
	lifeMessage.text = "Lives: " + lives;
}

function startGame() {
	console.log("Starting game at level 1");

	// clears the screen
	clearScreen();

	// creates the player
	createPlayer();

	// starts at level 1
	level = 1;

	// starts with 3 lives
	lives = 3;

	// adds or updates the life message sprite
	createLifeMessage();

	// updates the game state
	gameOver = false;
	recentlyLostLife = false;

	// begins spawning obstacles in 1 sec
	setTimeout(spawnObstacle, 1000);
}

function endGame() {
	// changes the game state
	gameOver = true;

	// displays text to play again
	createText("Game over! Press space to play again");
}

function loseLife() {
	lives -= 1;
	recentlyLostLife = true;
	updateLifeMessage();

	// out of lives, game over
	if (lives === 0) {
		endGame();
	} else {
		// clear all the current obstacles on the screen
		setTimeout(restartLife, 1500);
	}
}

function resetPlayer() {
	player.x = renderer.width / 2;
	player.y = renderer.height / 2;

	player.xv = 0;
	player.yv = 0;
}

function restartLife() {
	clearObstacles();

	resetPlayer();

	recentlyLostLife = false;
	spawnObstacle();
}

function obstacleOutOfRange(obstacle) {
	return obstacle.y + obstacle.radius < 0;
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

function updateObstacles() {
	obstacles.forEach(function(obstacle) {
		if (hitTestRectCircle(player, obstacle)) {
			// player hit an obstacle
			loseLife();
		} else if (obstacleOutOfRange(obstacle)) {
			// obstacle has left the screen, remove it
			removeObstacle(obstacle);
		} else {
			// nothing wrong, continue moving the obstacle
			obstacle.moveUp();
		}
	});
}

function updatePlayer() {
	// updates velocities based on our accel/deceleration values
	// so the player's movement is smoother
	// W
	if (keyPressed[WCODE]) {
		// accelerate in the negative y direction
		if (player.yv > MINVEL) {
			player.yv -= ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!keyPressed[SCODE] && player.yv < 0) {
			player.yv += DECELERATION;
		}
	}

	// A
	if (keyPressed[ACODE]) {
		// accelerate in the negative x direction
		if (player.xv > MINVEL) {
			player.xv -= ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!keyPressed[DCODE] && player.xv < 0) {
			player.xv += DECELERATION;
		}
	}

	// S
	if (keyPressed[SCODE]) {
		// accelerate in the positive y direction
		if (player.yv < MAXVEL) {
			player.yv += ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!keyPressed[WCODE] && player.yv > 0) {
			player.yv -= DECELERATION;
		}
	}

	// D
	if (keyPressed[DCODE]) {
		// accelerate in the positive x direction
		if (player.xv < MAXVEL) {
			player.xv += ACCELERATION;
		}
	} else {
		// opposite key wasn't pressed, we slow down
		if (!keyPressed[ACODE] && player.xv > 0) {
			player.xv -= DECELERATION;
		}
	}

	// updates position
	player.x += player.xv;
	player.y += player.yv;

	// maintains bounds
	maintainPlayerBounds();
}

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

function createText(s) {
	// take a string and display it on the screen
	message = new Text(s, 
		{fontFamily: "Arial", 
		fontSize: 64, 
		fill: "white", 
		wordWrap: true, 
		wordWrapWidth: renderer.width, 
		align: "center"}
	);
	
	// set text anchor to its center
	message.anchor.x = 0.5;
	message.anchor.y = 0.5;

	// set text position
	message.x = renderer.width / 2;
	message.y = renderer.height / 2;

	// add message to the stage
	stage.addChild(message);
}

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
	let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

	//hit will determine whether there's a collision
	hit = false;

	//Find the center points of each sprite
	r1.centerX = r1.x + r1.width / 2;
	r1.centerY = r1.y + r1.height / 2;
	r2.centerX = r2.x + r2.width / 2;
	r2.centerY = r2.y + r2.height / 2;

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
			// There's no collision on the y axis
			hit = false;
		}
	} else {
		// There's no collision on the x axis
		hit = false;
	}

	//`hit` will be either `true` or `false`
	return hit;
}

// progress handler
function loadProgressHandler(loader, resource) {
	// display file url being loaded
	console.log("loading: " + resource.url);

	// display percentage of files loaded
	console.log("progress: " + loader.progress + "%");
}

// key up
window.onkeyup = function(e) {
	keyPressed[e.keyCode] = false;
}

// key down
window.onkeydown = function(e) {
	keyPressed[e.keyCode] = true;
}
/* -------------- END functions -------------- */


// load images and starts the game
loader
	.add(["img/start_button.json"])
	.on("progress", loadProgressHandler)
	.load(setup);