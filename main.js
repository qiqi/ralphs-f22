"use strict";

var worldSize = [32*320, 32*320];
var screenSize = [1200, 800];

var game = new Phaser.Game(screenSize[0], screenSize[1], Phaser.AUTO, '', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

function preload() {
    game.load.image('f22', 'img/F22T.png');
    game.load.image('grass', 'img/grass.jpg');
    game.load.image('explosion', 'img/explosion.png');
    game.load.image('missile', 'img/missile.png');
    game.load.image('su2', 'img/SU2.png');
}

var f22 = {}, bgTile, key = {}, gy = {}, missiles = [];

function create() {
    var bgImg = 'grass';
    var xs = screenSize[0] + 512, ys = screenSize[0] + 512;
    game.world.setBounds(-xs, -ys, xs*2, ys*2);
    game.physics.startSystem(Phaser.Physics.P2JS);

	bgTile = game.add.tileSprite(-xs, -ys, xs*2, ys*2, bgImg);
	f22.sprite = game.add.sprite(0, 0, 'f22');
    f22.sprite.scale.setTo(0.5, 0.5);
    game.physics.p2.enable(f22.sprite);
    f22.speed = 500;
    f22.body = f22.sprite.body;
    game.camera.follow(f22.sprite);

    key.Up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    key.Down = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    key.Left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    key.Right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    key.Bar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    gyro.frequency = 50;
    gyro.startTracking(function(o){
        key = null;
        gy.x = o.x;
        gy.y = o.y;
        console.log(gy.x, gy.y);
    });
}

function gyroSpeed() {
    var spd = [250, 1000];
    var acc = [9.8, 0];
    if (gy.y < acc[1]) gy.y = acc[1];
    if (gy.y > acc[0]) gy.y = acc[0];
    return (gy.y - acc[0]) / (acc[1] - acc[0]) * (spd[1] - spd[0]) + spd[0];
}

function keySpeed() {
    if (key.Up.isDown && !key.Down.isDown) {
        return 1000;
    } else if (key.Down.isDown && !key.Up.isDown) {
        return 250;
    } else {
        return 500;
    }
}

function gyroTurn() {
    if (gy.x < -4) gy.x = -4;
    if (gy.x > +4) gy.x = +4;
    return -gy.x / 3;
}

function keyTurn() {
    if (key.Left.isDown && !key.Right.isDown) {
        return -1;
    } else if (key.Right.isDown && !key.Left.isDown) {
        return +1;
    } else {
        return 0;
    }
}

function update() {
    var xs = screenSize[0] + 512, ys = screenSize[0] + 512;
    game.world.setBounds(f22.body.x - xs, f22.body.y - ys, xs*2, ys*2);
    bgTile.x = Math.floor(f22.body.x / 512) * 512 - xs;
    bgTile.y = Math.floor(f22.body.y / 512) * 512 - ys;

    var angle = f22.body.angle * Math.PI / 180;
    f22.body.velocity.x = Math.cos(angle) * f22.speed;
    f22.body.velocity.y = Math.sin(angle) * f22.speed;

    var targetSpd;
    if (key) targetSpd = keySpeed();
    else targetSpd = gyroSpeed();
    f22.speed += (targetSpd - f22.speed) * 0.01;

    var targetTurn;
    if (key) targetTurn = keyTurn();
    else targetTurn = gyroTurn();
    targetTurn *= Math.pow(500 / f22.speed, 2);
    f22.body.angularVelocity += (targetTurn - f22.body.angularVelocity) * 0.04;

    if (key && key.Bar.isDown) {
        var dist;
        if (missiles.length == 0) {
            dist = 10000;
        } else {
            var dx = f22.body.x - missiles[0].body.x;
            var dy = f22.body.y - missiles[0].body.y;
            dist = Math.sqrt(dx * dx - dy * dy);
        }

        if (dist > 400) {
	        missiles.unshift(game.add.sprite(0, 0, 'missile'));
            missiles[0].scale.setTo(0.1, 0.1);
            game.physics.p2.enable(missiles[0]);
            missiles[0].body.x = f22.sprite.body.x + Math.cos(angle) * 64;
            missiles[0].body.y = f22.sprite.body.y + Math.sin(angle) * 64;
            missiles[0].body.angle = f22.sprite.angle;
            missiles[0].body.velocity.x = Math.cos(angle) * 1100;
            missiles[0].body.velocity.y = Math.sin(angle) * 1100;
        }
    }
}

function render() {
}

/*
var gamejs = require('gamejs');

gamejs.preload(["img/F22T.png", "img/grass.jpg"]);

function SpriteObject(worldSize, center, angle, image, rotation=0, scale=1) {
    this.worldSize = worldSize;
    this.center = center;
    this.angle = angle;
    this.image = gamejs.image.load(image).rotate(rotation);
    var imageSize = this.image.getSize();
    this.image = this.image.scale([imageSize[0] * scale, imageSize[1] * scale])
    return this;
};

SpriteObject.prototype.turn = function(angle) {
    this.angle += angle
};

SpriteObject.prototype.advance = function(distance) {
    this.center[0] += distance * Math.cos(this.angle * Math.PI / 180);
    this.center[1] += distance * Math.sin(this.angle * Math.PI / 180);
    for (var i = 0; i <= 1; ++ i) {
        if (this.center[i] > this.worldSize[i] / 2)
            this.center[i] -= this.worldSize[i];
        else if (this.center[i] > this.worldSize[i] / 2)
            this.center[i] += this.worldSize[i];
    }
};

SpriteObject.prototype.blit = function(display, viewCtr) {
    var img = this.image.rotate(this.angle);
    var imgSize = img.getSize();
    var scrSize = display.getSize();
    var x = this.center[0] - viewCtr[0] + (scrSize[0] - imgSize[0]) / 2;
    var y = this.center[1] - viewCtr[1] + (scrSize[1] - imgSize[1]) / 2;
    display.blit(img, [x, y]);
};

function blitBackground(screen, viewCtr) {
    var image = gamejs.image.load('img/grass.jpg');
    var imgSize = image.getSize();
    var scrSize = screen.getSize();

    var x0 = Math.round(viewCtr[0] - scrSize[0] / 2);
    var x1 = Math.round(viewCtr[0] + scrSize[0] / 2);
    var y0 = Math.round(viewCtr[1] - scrSize[1] / 2);
    var y1 = Math.round(viewCtr[1] + scrSize[1] / 2);
    for (var i = Math.floor(x0 / imgSize[0]) - 1;
             i < Math.floor(x1 / imgSize[0]) + 1; ++ i) {
        for (var j = Math.floor(y0 / imgSize[1]) - 1;
                 j < Math.floor(y1 / imgSize[1]) + 1; ++ j) {
            var x = i * imgSize[0] - x0;
            var y = j * imgSize[1] - y0;
            screen.blit(image, [x, y]);
        }
    }
}

function main() {

   var display = gamejs.display.getSurface();

   var worldSize = [10000, 10000];

   var airplane = new SpriteObject(worldSize, [0, 0], 0, 'img/F22T.png');
   airplane.turningL = false;
   airplane.turningR = false;
   airplane.thrust = false;
   airplane.firing = false;

   airplane.update = function(msDuration) {
       if (this.turningL)
           airplane.turn(-0.1 * msDuration);
       if (this.turningR)
           airplane.turn(+0.1 * msDuration);
       if (this.thrust)
           airplane.advance(1 * msDuration);
       else
           airplane.advance(0.5 * msDuration);
   };

   gamejs.event.onKeyDown(function(event) {
       if (event.key == gamejs.event.K_LEFT)
           airplane.turningL = true;
       else if (event.key == gamejs.event.K_RIGHT)
           airplane.turningR = true;
   });
   gamejs.event.onKeyUp(function(event) {
       if (event.key == gamejs.event.K_LEFT)
           airplane.turningL = false;
       else if (event.key == gamejs.event.K_RIGHT)
           airplane.turningR = false;
   });

   gamejs.onTick(function(msDuration) {
      airplane.update(msDuration);

      var viewCtr = airplane.center;
      blitBackground(display, viewCtr);
      airplane.blit(display, viewCtr);
   });

   gamejs.event.onDisplayResize(function(event) {
   });
};

// call main after all resources have finished loading
gamejs.ready(main);
*/
