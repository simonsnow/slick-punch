const GROUND_FRICTION = 0.7;
const AIR_RESISTANCE = 0.975;
const RUN_SPEED = 3.0;
const JUMP_POWER = 8;
const DOUBLE_JUMP_POWER = 12; // we need more force to counteract gravity in air
const GRAVITY = 0.55;
const MAX_AIR_JUMPS = 1; // double jump

function playerClass() {
	this.pos = vector.create(75, 75);
	this.speed = vector.create(0, 0);

	this.playerPic; // which picture to use
	this.name = "Player Character";
	this.health = 5;

	this.state = {
		'isOnGround': true,
		'isIdle': true,
		'isInMotion': false,
		'isMovingLeft': false, //Required to set character flip.
		'isCrouching': false,
		'isFacingUp': false, //Might be redundant
		'isAttacking': false, //combo punches, kick on 3 continuos punch
		'isDefending': false,
		'isAnimating' : false, // Used to set state between animation and final.
		
	};

	this.radius = 35;
	this.width = 80;
	this.height = 80;
	this.ang = 0;
	this.health = 0;
	this.removeMe = false;

	this.tickCount = 0;
	this.ticksPerFrame = 5;
	this.spriteAnim = null;
	this.framesAnim = null;

	this.keyHeld_Right = false;
	this.keyHeld_Left = false;
	this.keyHeld_Down = false;
	this.keyHeld_Up = false;
	this.keyHeld_Attack = false;
	this.keyHeld_Jump = false;
	this.keyHeld_Defend = false;

	this.keyHeld_Up_lastframe = false; // don't jump >1x per keypress

	this.controlKeyRight = null;
	this.controlKeyLeft = null;
	this.controlKeyUp = null;
	this.controlKeyDown = null;
	this.controlKeyAttack = null;
	this.controlKeyJump = null;
	this.controlKeyDefend = null;

	// Animation generation. 
	this.walkAnim = new SpriteSheetClass(playerWalkAnim, this.width, this.height, 10); // 10 frames
	this.punchAnim = new SpriteSheetClass(playerPunchAnim, this.width, this.height, 4); //4frames
	this.idleAnim = new SpriteSheetClass(playerIdleAnim, this.width, this.height, 7); //7 frames
	this.idleJumpAnim = new SpriteSheetClass(playerIdleJumpAnim, this.width, this.height, 5); //6 frames
	this.leftJabAnim = new SpriteSheetClass(playerLeftJabAnim, this.width, this.height, 7); //7 frames
	this.walkJumpAnim = new SpriteSheetClass(playerWalkJumpAnim, this.width, this.height, 5); //5 frames
	this.highKickAnim = new SpriteSheetClass(playerHighKickAnim, this.width, this.height, 6); //6 frames
	this.crouchAnim = new SpriteSheetClass(playerCrouchAnim, this.width, this.height, 4); //4 frames

	this.explosiveFallAnim = new SpriteSheetClass(playerIdleJumpAnim, this.width, this.height, 8); //8 frames
	this.hurtAnim = new SpriteSheetClass(playerLeftJabAnim, this.width, this.height, 3); //3 frames
	this.FlipAnim = new SpriteSheetClass(playerFlipAnim, this.width, this.height, 5); //5 frames
	this.rollAnim = new SpriteSheetClass(playerRollAnim, this.width, this.height, 7); //7 frames
	this.crouchedKickAnim = new SpriteSheetClass(playerCrouchedKickAnim, this.width, this.height, 4); //4 frames
	this.uppercutAnim = new SpriteSheetClass(playerUppercutAnim, this.width, this.height, 6); //4 frames
	this.deadAnim = new SpriteSheetClass(playerDeadAnim, this.width, this.height, 8); //8 frames




	this.attackAnimArr = [this.highKickAnim, this.leftJabAnim, this.punchAnim]

	//Used for animation.
	this.frameRow = 0;

	//Used to track sound play and pause.
	this.justPunched = false;
	this.justJumped = false;
	this.justKicked = false;

	this.doubleJumpCount = 0;

	// this.speed = RUN_SPEED;

	this.incrementTick = function () {

		this.tickCount++;

		if ( this.spriteAnim != null &&
			 this.tickCount / this.ticksPerFrame >= this.spriteAnim.frameNum) {
				this.tickCount = 0; //Looping animation.//
		}
	};


	this.checkAnimationCompletion = function(){

	}

	//sets all values of state object to false
	this.setStateToFalse = function (){
		for(key in this.state){
			this.state[key] = false;
		}
	};

	//sets value of given key pf state object to value passed
	this.setStateValueTo = function (key, val){
		if(this.state.hasOwnProperty(key)){
			// console.log("Setting" + key + ":" + val);
			this.state[key] = val;
		}
	};


	this.setupInput = function (upKey, rightKey, downKey, leftKey, attackKey, jumpKey, defendKey) {
		this.controlKeyUp = upKey;
		this.controlKeyRight = rightKey;
		this.controlKeyDown = downKey;
		this.controlKeyLeft = leftKey;
		this.controlKeyAttack = attackKey;
		this.controlKeyJump = jumpKey;
		this.controlKeyDefend = defendKey;
	}

	this.takeDamage = function (howMuch) {
		console.log("Damage received: " + howMuch);
		this.health -= howMuch;
		if (this.health <= 0) {
			console.log("PLAYER HAS 0 HP - todo: gameover/respawn");
		}
	}

	this.reset = function (whichImage, playerName, health) {
		this.name = playerName;
		this.playerPic = whichImage;
		this.health = health;
		this.doubleJumpCount = 0;

		for (var eachRow = 0; eachRow < WORLD_ROWS; eachRow++) {
			for (var eachCol = 0; eachCol < WORLD_COLS; eachCol++) {
				var arrayIndex = rowColToArrayIndex(eachCol, eachRow);
				if (worldGrid[arrayIndex] == WORLD_PLAYERSTART) {
					worldGrid[arrayIndex] = WORLD_BACKGROUND;
					// this.ang = -Math.PI/2;
					this.pos.x = eachCol * WORLD_W + WORLD_W / 2;
					this.pos.y = eachRow * WORLD_H + WORLD_H / 2;
					return;
				} // end of player start if
			} // end of col for
		} // end of row for
		console.log("NO PLAYER START FOUND!");
	} // end of playerReset func

	this.move = function () {
		

		if (this.state['isOnGround']) {

			this.speed.x *= GROUND_FRICTION;
			this.doubleJumpCount = 0;

		} 

		else { // in the air
				this.speed.x *= AIR_RESISTANCE;
				this.speed.y += GRAVITY;
				// cheap test to ensure can't fall through floor
				// improve this
				if (this.speed.y > this.radius) { 
					this.speed.y = this.radius;
				}
		}

		if (this.keyHeld_Left) {
				//this.setStateToFalse(); //setting every value of object to false; // might be buggy

				this.setStateValueTo("isInMotion", true);
				this.setStateValueTo("isMovingLeft", true);
				this.speed.x = -RUN_SPEED;
			}

		else if (this.keyHeld_Right) {
			//this.setStateToFalse();
			this.setStateValueTo("isInMotion", true);
			this.setStateValueTo("isMovingLeft", false);
			this.speed.x = RUN_SPEED;
		}

		else {
			this.setStateValueTo("isInMotion", false);		
			this.setStateValueTo("isIdle", true);
		}

	
		//For crouched movement 
		if (this.keyHeld_Down || this.keyHeld_Up) {
				//Up for uppercut
				this.setStateValueTo("isIdle", false);
				// this.setStateValueTo("isInMotion", false);
				this.setStateValueTo("isCrouching", true);
		}
		else{
			//Down for spin kick
			this.setStateValueTo("isCrouching", false);
			this.setStateValueTo("isIdle", true);


		}

		if (this.keyHeld_Attack) {
				this.setStateValueTo("isIdle", false);
				this.setStateValueTo("isInMotion", false);
				this.setStateValueTo("isAttacking", true);
				if(this.keyHeld_Up && this.state.isCrouching){
					
						// this.speed.y -= 0.05;
						// this.state.isOnGround = false;
					
				}
		}
		else{
			 this.setStateValueTo("isAttacking", false);

		}


		if (this.keyHeld_Jump && !this.keyHeld_Up_lastframe) {
			// this.setStateToFalse();
			this.keyHeld_Up_lastframe = true;

			if (this.state['isOnGround']) { // regular jump
				//console.log("Normal Jump!");
				this.speed.y -= JUMP_POWER;
				// this.setStateToFalse();
				this.setStateValueTo("isOnGround", false);
			}
			else if (this.doubleJumpCount < MAX_AIR_JUMPS) { // in the air?
				//console.log("Double Jump!");
				this.speed.y = 0;
				this.speed.y -= DOUBLE_JUMP_POWER;
				this.doubleJumpCount++;
				// this.setStateToFalse();

				this.setStateValueTo("isOnGround", false);
			} else {
				//console.log("Ignoring triple jump...");
			}
		}

	

		// avoid multiple jumps from the same keypress
		//TODO: Jump sound bug
		this.keyHeld_Up_lastframe = this.keyHeld_Jump;

		 if (this.justJumped == false) {
		 	playJumpSound();
		 }

		// if (this.state.isAttacking) {
		// 	this.state.isIdle = false;
		// 	this.state.isInMotion = false;
		// 	if (this.name == "Player") {
		// 		if (distance(enemy.pos.x, enemy.pos.y, this.pos.x, this.pos.y) < 30) {
		// 			enemy.remove = true;
		// 		}
		// 	}
		// 	if (this.justPunched == false) {
		// 		playPunchSound();
		// 	}
		// }

		// We need to set "justPunched", so that we do not play the punch sound every frame
		if (!this.state.isAttacking) {
			this.justPunched = false;
		} else {
			this.justPunched = true;
		}

		if (this.state['isOnGround']) {
			this.justJumped = false;
		} 
		else {
			this.justJumped = true;
		}

		if(this.state.isOnGround && this.state.isAttacking){
			this.speed.x = 0;
		}

		if (this.speed.y < 0 && isPlatformAtPixelCoord(this.pos.x, this.pos.y - this.radius) == 1) {
			this.pos.y = (Math.floor(this.pos.y / WORLD_H)) * WORLD_H + this.radius;
			this.speed.y = 0.0;
		}

		if (this.speed.y > 0 && isPlatformAtPixelCoord(this.pos.x, this.pos.y + this.radius) == 1) {
			this.pos.y = (1 + Math.floor(this.pos.y / WORLD_H)) * WORLD_H - this.radius;
			this.setStateValueTo("isOnGround", true);
			this.speed.y = 0;
		}
		else if (isPlatformAtPixelCoord(this.pos.x, this.pos.y + this.radius + 2) == 0) {
			// if(!this.state.isAttacking && !this.state.isCrouching){
			// 	this.setStateValueTo("isOnGround", false);

			// }
			this.setStateValueTo("isOnGround", false);
		}
		if (this.speed.x < 0 && isPlatformAtPixelCoord(this.pos.x - this.radius, this.pos.y) == 1) {
			this.pos.x = (Math.floor(this.pos.x / WORLD_W)) * WORLD_W + this.radius;
		}
		if (this.speed.x > 0 && isPlatformAtPixelCoord(this.pos.x + this.radius, this.pos.y) == 1) {
			this.pos.x = (1 + Math.floor(this.pos.x / WORLD_W)) * WORLD_W - this.radius;
		}


		this.pos.addTo(this.speed) // same as above, but for vertical
		playerWorldHandling(this);
		this.incrementTick();
	} // end of player.move function

	this.draw = function () {

		//TODO : Each animation should take atmost 1 sec to complete. 
		//TODO : Clean all code. 
		//TODO : Jump, Attack animation should work Only once
		//TODO : Crouch should run once and stick to that position. 


		if (this.state['isIdle']) {
			this.spriteAnim = this.idleAnim;
			this.framesAnim = this.spriteAnim.frameNum;
		}

		if (this.state['isInMotion'] ) {
			this.spriteAnim = this.walkAnim;
		}

			//Crouch Animation
		if (this.state['isCrouching']) {
			this.spriteAnim = this.crouchAnim;
			if(this.state.isInMotion){
				this.spriteAnim = this.rollAnim;

			}
		}

		// if (this.state['isInMotion'] && this.state['isCrouching']) {
		// }

		if (this.state['isAttacking']) {
			this.spriteAnim = this.punchAnim;
			if(this.state.isCrouching){
				if(this.keyHeld_Up){
					this.spriteAnim = this.uppercutAnim;
				}
				else{
					this.spriteAnim = this.crouchedKickAnim;
				}
			}

			// this.attackAnimArr[Math.floor(Math.random()*this.attackAnimArr.length)];
		}


		//is Jumping or falling
		if (!this.state['isOnGround']) {
			this.spriteAnim = this.idleJumpAnim;
			if(this.keyHeld_Up){
				this.spriteAnim = this.FlipAnim;
			}
		}

		if (this.state['isAttacking'] && !this.state['isOnGround']) {
				this.spriteAnim = this.highKickAnim;
				// this.attackAnimArr[Math.floor(Math.random()*this.attackAnimArr.length)];
		}


	

		//Once crouch animation complete. Call a function to draw in fixed state instead of animation. 
		//final drawing of sprite.
		if (this.spriteAnim !=null) {
			this.spriteAnim.draw(Math.floor(this.tickCount / this.ticksPerFrame), this.frameRow, this.pos.x, this.pos.y, this.ang, this.state.isMovingLeft);
		}

	}
}

function isPlatformAtPixelCoord(hitPixelX, hitPixelY) {
	var tileCol = hitPixelX / WORLD_W;
	var tileRow = hitPixelY / WORLD_H;

	// using Math.floor to round down to the nearest whole number
	tileCol = Math.floor(tileCol);
	tileRow = Math.floor(tileRow);

	// first check whether the jumper is within any part of the brick wall
	if (tileCol < 0 || tileCol >= WORLD_COLS ||
		tileRow < 0 || tileRow >= WORLD_ROWS) {
		return false;
	}

	var brickIndex = rowColToArrayIndex(tileCol, tileRow);
	return (worldGrid[brickIndex] >= 0);
}


