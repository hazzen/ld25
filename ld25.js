var Ignore = {
  MOOK: 1 << 0,
  HERO: 1 << 1,
  BULLET: 1 << 2,
};

var BuildGame = function() {
};

BuildGame.prototype.makeHtml = function(owner) {
  owner = d3.select(owner);

  var buyThings = [
    {name: 'mook', clazz: Mook},
  ];
  var fortifyClick = function(o) {
    var bs = owner.select('.right').selectAll('button.subAction')
        .data(buyThings);
    bs.exit().remove();
    bs.enter().append('button')
        .attr('class', 'subAction');
    bs
        .text(function(d) { return d.name + ' - $' + d.clazz.price; });

    bs.on('click', function(d) {
      ShootGame.GAME.levelEdit_.listen(RENDERER.elem(), d.clazz);
    });
  };

  var endDayClick = function() {
    ShootGame.GAME.setLevel(
        new Level(Level.loadFromString(Level.randomOfHeight(2)), DEFAULT_BLOCKS));
  };

  var buttons = [
    {name: 'fortify lair', click: fortifyClick, sub: true},
    {name: 'make demands'},
    {name: 'taunt the hero'},
    {name: 'end the day', click: endDayClick},
  ];

  var bs = owner.select('.left').selectAll('button.action')
      .data(buttons)
  bs.exit().remove();
  bs.enter().append('button')
      .attr('class', 'action');
  bs
      .text(function(d) { return d.name; });
  bs.on('click', function(d) {
    bs.classed('selected', false);
    if (d.click) {
      d.click(d);
      if (d.sub) {
        d3.select(this).classed('selected', true);
      }
    } else {
      owner.select('.right').selectAll('button.subAction').remove();
    }
  });
};

var LevelEdit = function(game) {
  this.game = game;
};

LevelEdit.prototype.handleEvent = function(e) {
  if (!this.game.level_) return;
  if (!this.piece) return;
  this.bx = Math.floor(e.layerX / Block.SIZE);
  this.by = Math.floor(e.layerY / Block.SIZE);
  var w = this.piece.collider_.w();
  var h = this.piece.collider_.h();
  if (e.type == 'mousemove') {
    this.piece.collider_.aabb.setXY(
      this.bx * Block.SIZE + (Block.SIZE - w) / 2,
      this.by * Block.SIZE + (Block.SIZE - h) / 2);
  } else if (e.type == 'click') {
    if (this.isLegal(this.bx, this.by)) {
      this.game.addEnemy(this.piece);
      this.piece = new this.clazz(-100, -100);
    }
  }
};

LevelEdit.prototype.isLegal = function(bx, by) {
  var legal = false;
  var onTopOf = this.game.level_.blockAt(bx * Block.SIZE, by * Block.SIZE);
  if (onTopOf) {
    var onTopBlock = this.game.level_.blockMap_[onTopOf.charCodeAt(0)];
    if (!onTopBlock || !(onTopBlock.collideSides_ & Block.COLLIDE_SIDES)) {
      legal = true;
    }
  }
  return legal;
};

LevelEdit.prototype.listen = function(elem, clazz) {
  elem.addEventListener('mousemove', this, false);
  elem.addEventListener('click', this, false);
  this.clazz = clazz;
  this.piece = new clazz(-100, -100);
};

LevelEdit.prototype.unlisten = function(elem) {
  elem.removeEventListener('mousemove', this, false);
  elem.removeEventListener('click', this, false);
};

LevelEdit.prototype.render = function(renderer) {
  var ctx = renderer.context();
  if (this.piece) {
    this.piece.render(renderer);
    if (this.bx != null) {
      var x = this.bx * Block.SIZE;
      var y = this.by * Block.SIZE;
      ctx.strokeStyle = this.isLegal(this.bx, this.by) ? '#0f0' : '#f00';
      ctx.lineWidth = '3';
      ctx.beginPath();
      ctx.moveTo(x - 1.5, y - 1.5);
      ctx.lineTo(x + Block.SIZE + 1.5, y - 1.5);
      ctx.lineTo(x + Block.SIZE + 1.5, y + Block.SIZE + 1.5);
      ctx.lineTo(x - 1.5, y + Block.SIZE + 1.5);
      ctx.closePath();
      ctx.stroke();
    }
  }
};

var ShootGame = function() {
  this.hero_ = new Hero(Block.SIZE + 4, Block.SIZE + 4);
  this.levelEdit_ = new LevelEdit(this);

  this.ents = [];
  this.particles = [];
  this.enemies = [];
  this.bullets = [];
  this.possessI = -1;
  ShootGame.GAME = this;
};
ShootGame.GAME = null;

ShootGame.addEnt = function(ents, ent) {
  for (var i = 0; i < ents.length; ++i) {
    var curEnt = ents[i];
    if (!curEnt || curEnt.dead) {
      ents[i] = ent;
      return;
    }
  }
  ents.push(ent);
};

ShootGame.prototype.addBullet = function(bullet) {
  ShootGame.addEnt(this.bullets, bullet);
};

ShootGame.prototype.addEnt = function(ent) {
  ShootGame.addEnt(this.ents, ent);
};

ShootGame.prototype.addEnemy = function(ent) {
  ShootGame.addEnt(this.ents, ent);
  ShootGame.addEnt(this.enemies, ent);
};

ShootGame.prototype.addParticle = function(ent) {
  ShootGame.addEnt(this.particles, ent);
};

ShootGame.renderEntFn = function(renderer) {
  return function(ent) {
    if (ent && !ent.dead && ent.render) {
      ent.render(renderer);
    }
  };
};

ShootGame.tickEntFn = function(t) {
  return function(ent) {
    if (ent && !ent.dead && ent.tick) {
      ent.tick(t);
    }
  };
};

ShootGame.prototype.setLevel = function(level) {
  this.hero_.collider_.aabb.setXY(Block.SIZE, Block.SIZE);
  this.level_ = level;
};

ShootGame.prototype.nextPossess = function() {
  var foundI = this.possessI + 1;
  if (foundI >= this.enemies.length) {
    foundI = 0;
  }
  while (foundI != this.possessI) {
    if (this.enemies[foundI] && !this.enemies[foundI].dead) {
      break;
    }
    foundI++;
    if (foundI >= this.enemies.length) {
      foundI = 0;
    }
  }
  if (foundI != this.possessI) {
    if (this.possessI >= 0 && this.possessI < this.enemies.length) {
      this.enemies[this.possessI].possess(false);
    }
    this.enemies[foundI].possess(true);
    this.possessI = foundI;
  }
};
ShootGame.prototype.tick = function(t) {
  if (KB.keyPressed(Keys.TAB)) {
    this.nextPossess();
  }

  this.hero_.tick(t);

  var collide = this.level_.collideEnt(this.hero_, t);
  this.hero_.handleLevelCollide(collide);
  this.ents.forEach(bind(function(ent) {
    if (!ent.dead) {
      var collide = this.level_.collideEnt(ent, t);
      ent.handleLevelCollide(collide);
    }
  }, this));
  this.bullets.forEach(bind(function(bullet) {
    if (!bullet.dead) {
      var collide = this.level_.collideEnt(bullet, t);
      bullet.handleLevelCollide(collide);
    }
  }, this));

  var tickFn = ShootGame.tickEntFn(t);
  this.ents.forEach(tickFn);
  this.bullets.forEach(tickFn);
  this.particles.forEach(tickFn);

  var collides = this.bullets.concat(this.enemies)
      .filter(function(f) { return !f.dead; })
      .map(function(f) { return f.collider_; });
  Collider.stepAll(collides, t);
  this.bullets.forEach(function(bullet) {
    if (!bullet.dead) {
      if (bullet.collider_.lastCollision) {
        bullet.dead = true;
      }
    }
  });
  this.enemies.forEach(function(enemy) {
    if (!enemy.dead) {
      if (enemy.collider_.lastCollision) {
        enemy.dead = true;
        this.addParticle(new DeathFall(enemy, '#f56f58',
            sgn(enemy.collider_.lastCollision.object.vx)));
      }
    }
  }, this);

  //Collider.stepAll([this.hero_.collider_], t);
};

ShootGame.prototype.render = function(renderer) {
  this.level_.render(renderer);
  var renderFn = ShootGame.renderEntFn(renderer);
  this.ents.forEach(renderFn);
  this.bullets.forEach(renderFn);
  this.particles.forEach(renderFn);
  this.hero_.render(renderer);

  this.levelEdit_.render(renderer);
};

Controller = function() {
};

Controller.prototype.tick = function(t) {};
Controller.prototype.left = function() { return false; }
Controller.prototype.right = function() { return false; }
Controller.prototype.jump = function() { return false; }
Controller.prototype.shoot = function() { return false; }

var AiController = function(actor) {
  baseCtor(this);
  this.actor = actor;
  this.dir = 0;
  this.doJump = false;
};
inherit(AiController, Controller);

AiController.prototype.tick = function(t) {
  var block = ShootGame.GAME.level_.blockAt(
      this.actor.collider_.cx(), this.actor.collider_.cy());
  if (block == '>') {
    this.dir = 1;
  } else if (block == '<') {
    this.dir = -1;
  } else if (block == '^') {
    this.doJump = true;
  } else {
    this.doJump = false;
  }
};
AiController.prototype.left = function() { return this.dir < 0; }
AiController.prototype.right = function() { return this.dir > 0; }
AiController.prototype.jump = function() { return this.doJump; }
AiController.prototype.shoot = function() { return true; }

var KbController = function() {
  baseCtor(this);
};
inherit(KbController, Controller);

KbController.prototype.left = function() { return KB.keyDown(Keys.LEFT); };
KbController.prototype.right = function() { return KB.keyDown(Keys.RIGHT); };
KbController.prototype.jump = function() { return KB.keyDown('z'); };
KbController.prototype.shoot = function() { return KB.keyDown('x'); };

var Bullet = function(x, y, vx, opts) {
  var w = opts.w || 4;
  var h = opts.h || 4;
  this.collider_ = Collider.fromCenter(x, y, w, h, vx, 0);
  this.collider_.ignore = opts.ignore;
};

Bullet.prototype.handleLevelCollide = function(collide) {
  this.collider_.aabb.setXY(collide.x, collide.y);
  if (collide.yl || collide.yh || collide.xl || collide.xh) {
    this.dead = true;
  }
};

Bullet.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.fillStyle = '#666';
  ctx.fillRect(this.collider_.x(), this.collider_.y(),
               this.collider_.w(), this.collider_.h());
};

var Actor = function(x, y, w, h, opt_opts) {
  this.collider_ = Collider.fromCenter(x, y, w, h, 0, 0);
  this.jumping = 0;
  this.falling = 1;
  this.facing = 1;
  this.controller = new Controller();
  this.nextShot = 0;

  this.opts = opt_opts || {};
  this.opts.shotDelay = this.opts.shotDelay || 0.2;
  this.maxSpeed = this.opts.maxSpeed || 80;
};

Actor.prototype.tick = function(t) {
  this.controller.tick(t);
  this.nextShot -= t;
  var down = false;
  if (this.controller.left()) {
    this.facing = -1;
    this.collider_.vx -= t * this.maxSpeed;
    down = true;
  }
  if (this.controller.right()) {
    this.facing = 1;
    this.collider_.vx += t * this.maxSpeed;
    down = true;
  }
  if (Math.abs(this.collider_.vx) > this.maxSpeed) {
    this.collider_.vx = sgn(this.collider_.vx) * this.maxSpeed;
  } else if (Math.abs(this.collider_.vx) > 0.01) {
    this.collider_.vx -= sgn(this.collider_.vx) *
        Math.min(t * 50, Math.abs(this.collider_.vx));
  } else if (!down) {
    this.collider_.vx = 0;
  }

  if (this.controller.jump()) {
    if (!this.jumping) {
      this.jumping = true;
      this.collider_.vy = -100;
    }
  }
  if (this.falling) {
    this.collider_.vy += 160 * t;
  }

  if (this.controller.shoot() && this.nextShot < 0) {
    this.nextShot = this.opts.shotDelay;
    ShootGame.GAME.addBullet(new Bullet(
        this.collider_.cx(),// + this.facing * this.collider_.w() / 2,
        this.collider_.cy(),
        this.facing * 160 * 1.5,
        {ignore: this.opts.bulletIgnore}));
  }
};

Actor.prototype.handleLevelCollide = function(collide) {
  this.collider_.aabb.setXY(collide.x, collide.y);
  if (collide.yl || collide.yh) {
    if (this.collider_.vy >= 0) {
      this.falling = 0;
      this.jumping = 0;
    }
    this.collider_.vy = 0;
  } else {
    this.falling = 1;
  }
  if (collide.xl || collide.xh) {
    this.collider_.vx = 0;
  }
};

var Hero = function(x, y) {
  baseCtor(this, x, y, 8, 16, {
    bulletIgnore: Ignore.HERO | Ignore.BULLET,
  });

  this.controller = new AiController(this);
};
inherit(Hero, Actor);

Hero.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.fillStyle = '#659f58';
  ctx.fillRect(this.collider_.x(), this.collider_.y(),
               this.collider_.w(), this.collider_.h());
};

var Mook = function(x, y, opt_opts) {
  var opts = opt_opts || {};
  opts.bulletIgnore = Ignore.MOOK | Ignore.BULLET;
  baseCtor(this, x, y, opts.w || 8, opts.h || 16, opts);
  this.collider_.ignore = Ignore.MOOK;
  this.possessed = false;
};
inherit(Mook, Actor);
Mook.price = 5;

Mook.prototype.possess = function(doPossess) {
  if (doPossess == this.possessed) {
    return;
  }
  this.possessed = doPossess;
  if (this.possessed) {
    this.oldController = this.controller;
    this.controller = new KbController();
  } else {
    this.controller = this.oldController;
  }
};

Mook.prototype.render = function(renderer) {
  var ctx = renderer.context();
  if (this.possessed) {
    ctx.fillStyle = '#f9a494';
  } else {
    ctx.fillStyle = '#f56f58';
  }
  ctx.fillRect(this.collider_.x(), this.collider_.y(),
               this.collider_.w(), this.collider_.h());
};


var Particle = function(life) {
  this.life = life;
  this.startLife = life;
};

Particle.prototype.alpha = function() {
  return this.life / this.startLife;
};

Particle.prototype.tick = function(t) {
  this.life -= t;
  if (this.life < 0) {
    this.dead = true;
  }
};

var DeathFall = function(actor, color, dir) {
  baseCtor(this, 1);
  this.aabb = actor.collider_.aabb;
  this.color = color;
  this.rot = Math.PI * dir * randFlt(0.1, 0.2);
  this.vx = dir * 10;
};
inherit(DeathFall, Particle);

DeathFall.prototype.tick = function(t) {
  base(this, 'tick', t);
  this.aabb.addXY(this.vx * t, 0);
};

DeathFall.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.save();
  var w = this.aabb.w();
  ctx.globalAlpha = this.alpha();
  ctx.translate(this.aabb.x() + w / 2, this.aabb.y());
  ctx.rotate(this.rot);
  ctx.fillStyle = this.color;
  ctx.fillRect(-w / 2, 0, w, this.aabb.h());
  ctx.restore();
};

function Block(render, collideSides) {
  this.render = render;
  this.collideSides_ = collideSides;
};

Block.SIZE = 16;
Block.COLLIDE_NONE =   0;
Block.COLLIDE_BOTTOM = 1 << 0;
Block.COLLIDE_TOP =    1 << 1;
Block.COLLIDE_SIDES =  1 << 2;
Block.COLLIDE_ALL = Block.COLLIDE_TOP | Block.COLLIDE_BOTTOM | Block.COLLIDE_SIDES;

function BlockMap(blocks) {
  this.blocks = blocks;
};

var DEFAULT_BLOCKS = {
  '1': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = 'rgb(128, 128, 128)';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
       },
       Block.COLLIDE_ALL),

  '#': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = 'rgba(126, 106, 95, 0.5)';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
         ctx.fillStyle = 'rgba(126, 89, 70, 0.5)';
         ctx.fillRect(x + 2, y + 2, Block.SIZE - 4, Block.SIZE - 4);
         ctx.fillStyle = 'rgba(70, 56, 53, 0.5)';
         for (var i = 1; i < 3; ++i) {
           ctx.fillRect(x + i * Block.SIZE / 3 - 1, y + 2, 2, Block.SIZE - 4);
         }
       },
       Block.COLLIDE_NONE),

  '2': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = 'rgb(126, 106, 95)';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
         ctx.fillStyle = 'rgb(126, 89, 70)';
         ctx.fillRect(x + 2, y + 2, Block.SIZE - 4, Block.SIZE - 4);
         ctx.fillStyle = 'rgb(70, 56, 53)';
         for (var i = 1; i < 3; ++i) {
           ctx.fillRect(x + i * Block.SIZE / 3 - 1, y + 2, 2, Block.SIZE - 4);
         }
       },
       Block.COLLIDE_ALL),

  '-': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#666';
         ctx.fillRect(x, y, Block.SIZE, 4);

         ctx.fillStyle = 'rgba(255, 224, 122, 0.5)';
         ctx.beginPath();
         ctx.moveTo(x + Block.SIZE / 4, y + 4);
         ctx.lineTo(x + 3 * Block.SIZE / 4, y + 4);
         ctx.lineTo(x + 2 * Block.SIZE, y + 2 * Block.SIZE);
         ctx.lineTo(x - Block.SIZE, y + 2 * Block.SIZE);
         ctx.closePath();
         ctx.fill();
       },
       Block.COLLIDE_TOP),

  '>': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#111';
         ctx.fillRect(x, y, Block.SIZE / 2, Block.SIZE);
         ctx.fillRect(x + Block.SIZE / 2, y + Block.SIZE / 4, Block.SIZE / 2, Block.SIZE / 2);
       },
       Block.COLLIDE_NONE),

  '<': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#111';
         ctx.fillRect(x + Block.SIZE / 2, y, Block.SIZE / 2, Block.SIZE);
         ctx.fillRect(x, y + Block.SIZE / 4, Block.SIZE / 2, Block.SIZE / 2);
       },
       Block.COLLIDE_NONE),

  '^': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#111';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE / 2);
         ctx.fillRect(x + Block.SIZE / 4, y + Block.SIZE / 2, Block.SIZE / 2, Block.SIZE / 2);
       },

       Block.COLLIDE_NONE),
};

for (var b in DEFAULT_BLOCKS) {
  DEFAULT_BLOCKS[b.charCodeAt(0)] = DEFAULT_BLOCKS[b];
}

var RIGHT_BLOCKS = [
  [
    ' ----   ----   ----',
    '                   ',
    '                   ',
    '>                  ',
    '>^                 ',
    '>^2222      ^^22222',
    '1111111111111111111',
  ],
  [
    '>                21',
    '--- ^--- ^---   <21',
    '               <221',
    '    221111111111111',
    '    22             ',
    '>   ##       ^222  ',
    '1111111111111111111',
  ],
];

var RIGHT_DOWN_BLOCKS = [
  [
    '  ---   ---   ---  ',
    '                   ',
    '                   ',
    '                   ',
    '                   ',
    '                   ',
    '11111111111111     ',
  ],
  [
    '  ---   ---   ---  ',
    '   2               ',
    '   22 2            ',
    '   22 2            ',
    '^^^####            ',
    '^^22222            ',
    '11111111111111     ',
  ],
];

var LEFT_BLOCKS = [
  [
    ' ----    ----   -- ',
    '                   ',
    '                   ',
    '                   ',
    '       22^^^    ^^ ',
    '      2222^^  22^^<',
    '1111111111111111111',
  ],
  [
    ' ----    ----   -- ',
    '                   ',
    '              <<   ',
    '              2<   ',
    '       22^^^  2^   ',
    '      2222^^  22^^<',
    '1111111111111111111',
  ],
];

var LEFT_DOWN_BLOCKS = [
  [
    '  ---   ---   ---  ',
    '                   ',
    '                   ',
    '                   ',
    '                   ',
    '                   ',
    '      1111111111111',
  ],
];

Level.randomOfHeight = function(floors) {
  var dir = 1;
  var roof = '1111111111111111111111111111111111111111';
  var lines = [roof];
  for (; floors > 0; --floors) {
    var norm = dir > 0 ? RIGHT_BLOCKS : LEFT_BLOCKS;
    var down = dir > 0 ? RIGHT_DOWN_BLOCKS : LEFT_DOWN_BLOCKS;
    var leftHalf = pick(norm);
    var rightHalf = pick(floors == 1 ? norm : down);
    if (dir < 0) {
      var t = leftHalf;
      leftHalf = rightHalf;
      rightHalf = t;
    }
    for (var i = 0; i < leftHalf.length; ++i) {
      var line = '1' + leftHalf[i] + rightHalf[i] + '1';
      lines.push(line);
    }
    dir *= -1;
  }
  lines.push(roof);
  return lines.join('\n') + '\n';
};

var LEVEL_1 = (
  '1111111111111111111111111111111111111111\n' +
  '1 ----    ----    ----    ----    ---- 1\n' +
  '1                                      1\n' +
  '1                                      1\n' +
  '1                                      1\n' +
  '1                                      1\n' +
  '1>^2222      ^^22222                   1\n' +
  '11111111111111111111111111111111       1\n' +
  '1 ----    ----    ----    ----         1\n' +
  '1                                     <1\n' +
  '1                                     <1\n' +
  '1                                     <1\n' +
  '1                                     <1\n' +
  '1      2222^^      22222^^      <<<<<<<1\n' +
  '1111111111111111111111111111111111111111\n');

function Level(blocks, blockMap) {
  this.blocks_ = blocks;
  this.blockMap_ = blockMap;
};

Level.loadFromString = function(str) {
  var blocks = [];
  var rowLen = -1;
  var lineNum = 1;
  do {
    var row = [];
    var newline = str.indexOf('\n');
    var lineStr = str;
    if (newline != -1) {
      lineStr = str.substr(0, newline);
      str = str.substr(newline + 1);
    }
    for (var i = 0; i < lineStr.length; ++i) {
      var code = lineStr.charCodeAt(i);
      if (code == 32) {
        row.push(0);
      } else {
        row.push(code);
      }
    }
    lineNum++;
    blocks.push(row);
    if (rowLen == -1) {
      rowLen = row.length;
    } else if (row.length != rowLen) {
      throw Error('Wrong line length at line ' + lineNum);
    }
  } while (str);
  return blocks;
};

Level.prototype.blockInLine_ = function(x, y, vertical, dir) {
  x = x / Block.SIZE;
  y = y / Block.SIZE;
  var bx = (!vertical && dir == 1) ? Math.ceil(x) : Math.floor(x);
  var by = (vertical && dir == 1) ? Math.ceil(y) : Math.floor(y);
  var collide = (vertical ?
      (dir == 1 ? Block.COLLIDE_TOP : Block.COLLIDE_BOTTOM) :
      Block.COLLIDE_SIDES);
  while (by >= 0 && by < this.blocks_.length &&
         bx >= 0 && bx < this.blocks_[0].length) {
    var block = this.blockMap_[this.blocks_[by][bx]];
    if (block && block.collideSides_ & collide) {
      return {block: block, x: bx * Block.SIZE, y: by * Block.SIZE};
    }
    if (vertical) {
      by += dir;
    } else {
      bx += dir;
    }
  }
  return null;
};

Level.prototype.collideEnt_ = function(ent, t, vertical) {
  var collider = ent.collider_;
  var v = t * (vertical ? collider.vy : collider.vx);
  var p = vertical ? collider.y() : collider.x();
  if (v == 0) {
    return { p: p + v };
  }
  var dir = v < 0 ? -1 : 1;
  var po = dir < 0 ? 0 : (vertical ? collider.h() : collider.w());

  var x1 = collider.x() + (vertical ? EPSILON : po);
  var y1 = collider.y() + (vertical ? po : EPSILON);
  var x2 = vertical ? collider.x() + collider.w() : x1;
  var y2 = vertical ? y1 : collider.y() + collider.h();
  if (x1 != x2) {
    x2 -= EPSILON;
  } else {
    y2 -= EPSILON;
  }

  var lo = this.blockInLine_(x1, y1, vertical, dir);
  var hi = this.blockInLine_(x2, y2, vertical, dir);

  var pFor = function(block) {
    if (block) {
      var bp = (vertical ? block.y : block.x) + (dir < 0 ? Block.SIZE : 0);
      if (sgn(p + po - bp) != sgn(p + po + v - bp)) {
        return bp - po;
      }
    }
    return null;
  };

  var lop = pFor(lo);
  var hip = pFor(hi);

  var struct = { p: p + v };
  if (lop != null) {
    struct.p = lop;
    struct.lo = lo;
  }
  if (hip != null) {
    struct.p = hip;
    struct.hi = hi;
  }
  return struct;
};

Level.prototype.collideEnt = function(ent, t) {
  var c = ent.collider_;
  var ox = c.x();
  var oy = c.y();
  var sx = this.collideEnt_(ent, t, false);
  c.aabb.setXY(sx.p, oy);
  var sy = this.collideEnt_(ent, t, true);
  c.aabb.setXY(ox, oy);

  var struct = {x: sx.p, y: sy.p};
  struct.xl = sx.lo;
  struct.xh = sx.hi;
  struct.yl = sy.lo;
  struct.yh = sy.hi;
  return struct;
};

Level.prototype.blockAt = function(x, y) {
  var bx = Math.floor(x / Block.SIZE);
  var by = Math.floor(y / Block.SIZE);
  if (by < 0 || by >= this.blocks_.length) return null;
  if (bx < 0 || bx >= this.blocks_[0].length) return null;
  var blockI = this.blocks_[by][bx];
  if (blockI) {
    return String.fromCharCode(blockI);
  }
  return ' ';
};

Level.prototype.render = function(renderer) {
  for (var row = 0; row < this.blocks_.length; ++row) {
    var rowBlocks = this.blocks_[row];
    for (var col = 0; col < rowBlocks.length; ++col) {
      if (rowBlocks[col]) {
        this.blockMap_[rowBlocks[col]].render(
            renderer, col * Block.SIZE, row * Block.SIZE);
      }
    }
  }
};
