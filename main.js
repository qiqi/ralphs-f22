"use strict";

var worldSize = [32*320, 32*320];
// var screenSize = [1200, 800];
var screenSize = [1200, 2200];

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
    game.load.image('man', 'img/man.png');
}

var f22 = {}, bg = {}, key = {}, gy = {}, missiles = {}, enemies = {};

function create() {
    var bgImg = 'grass';
    var xs = screenSize[0] + 512, ys = screenSize[0] + 512;
    game.world.setBounds(-xs, -ys, xs*2, ys*2);
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);
    game.physics.p2.restitution = 0.1;

	bg.tile = game.add.tileSprite(-xs, -ys, xs*2, ys*2, bgImg);
	bg.man = game.add.sprite(0, 0, 'man');
	bg.man.scale.set(0.1);

    missiles.members = [];
    missiles.collisionGroup = game.physics.p2.createCollisionGroup();

    enemies.members = [];
    enemies.collisionGroup = game.physics.p2.createCollisionGroup();

	f22.sprite = game.add.sprite(0, 0, 'f22');
    f22.sprite.scale.set(0.5);
    game.physics.p2.enable(f22.sprite);
    f22.speed = 400;
    f22.body = f22.sprite.body;
    game.camera.follow(f22.sprite);

    f22.collisionGroup = game.physics.p2.createCollisionGroup();
    f22.body.setCircle(28);
    // f22.body.collides(enemies.collisionGroup, function(){console.log('HIT');});
    f22.body.collides([missiles.collisionGroup, enemies.collisionGroup]);

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
    bg.tile.x = Math.floor(f22.body.x / 512) * 512 - xs;
    bg.tile.y = Math.floor(f22.body.y / 512) * 512 - ys;

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
    f22.body.angularVelocity += (targetTurn - f22.body.angularVelocity) * 0.5;

    for (var i = missiles.members.length - 1; i >= 0; -- i) {
        var m = missiles.members[i];
        var dx = m.body.x - m.previous_x;
        var dy = m.body.y - m.previous_y;
        m.previous_x = m.body.x;
        m.previous_y = m.body.y;
        missiles.members[i].traveled += Math.sqrt(dx * dx + dy * dy);
        if (m.traveled > 1000) {
            m.kill();
            missiles.members.splice(i, 1);
        }
    }

    if (key && key.Bar.isDown || game.input.pointer1.isDown) {
        var dist;
        if (missiles.members.length == 0) {
            dist = 10000;
        } else {
            var dx = f22.body.x - missiles.members[0].body.x;
            var dy = f22.body.y - missiles.members[0].body.y;
            dist = Math.sqrt(dx * dx + dy * dy);
        }

        if (dist > 150) {
            var spread = [-32, 32, 0];
            for (var iSpread in spread) {
                console.log(spread);
	            missiles.members.unshift(game.add.sprite(0, 0, 'missile'));
                missiles.members[0].scale.set(0.1);
                missiles.members[0].previous_x = f22.sprite.body.x;
                missiles.members[0].previous_y = f22.sprite.body.y;
                missiles.members[0].traveled = 0;
                game.physics.p2.enable(missiles.members[0]);

                var body = missiles.members[0].body;
                body.setCollisionGroup(missiles.collisionGroup);
                body.collides([f22.collisionGroup]);

                body.x = f22.sprite.body.x + Math.cos(angle) * 64 + Math.sin(angle) * spread[iSpread];
                body.y = f22.sprite.body.y + Math.sin(angle) * 64 - Math.cos(angle) * spread[iSpread];
                body.angle = f22.sprite.angle;
                body.velocity.x = Math.cos(angle) * 2000;
                body.velocity.y = Math.sin(angle) * 2000;
            }
        }
    }

    if (enemies.members.length < 1) {
	    enemies.members.unshift(game.add.sprite(0, 0, 'su2'));
        enemies.members[0].scale.set(0.5);
        game.physics.p2.enable(enemies.members[0]);

        var body = enemies.members[0].body;
        body.setCollisionGroup(enemies.collisionGroup);
        body.setCircle(28);
        body.collides(f22.collisionGroup);

        angle = Math.random() * 360;

        body.x = f22.sprite.body.x + Math.cos(angle) * 640;
        body.y = f22.sprite.body.y + Math.sin(angle) * 640;
        body.angle = f22.sprite.angle * 180 / Math.PI;
        body.velocity.x = Math.cos(angle) * 300;
        body.velocity.y = Math.sin(angle) * 300;
    }
}

function render() {
}
