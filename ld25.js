var FIRSTS = [
  'david', 'lukas', 'nathan', 'amar', 'aaron', 'leon', 'jan', 'alejandro',
  'sarah', 'emma', 'amelia', 'sofia', 'hanna', 'mathilda', 'alice',
  'liam', 'jayden', 'sebastian', 'gunter',
  'ava', 'xena', 'emma lou', 'camila',
  'bob', 'jorge', 'jane', 'nancy', 'paul', 'sergio', 'chloe',
];
var LASTS = [
  'wilson', 'kelly', 'morrison', 'sanders', 'griffiths', 'wilson-wilson',
  'erikson', 'anderson', 'garcia', 'serrano', 'gomez', 'popa', 'novak',
  'de groot', 'de vries', 'van der meer', 'van leeuwen', 'bianchi',
  'smith', 'clark', 'wright', 'king', 'baker', 'green', 'parker', 'edwards',
  'morgan', 'hooper', 'watson',
];
var DESCRIPTS = [
  'knitter', 'mean pool shot', 'regional pong champ', 'dancer', 'family-person',
  'lover of cheese', 'bibliophile', 'conspiracy theorist', 'scholar',
  'master of disaster', 'flatulent oaf', 'thumb-twiddler', 'lifelong slacker',
  'frequent masturbator', 'virgin', 'champion pogo stick racer',
  'horse jockey', 'poodle breeder', 'doctor', 'lawyer', 'plebe',
  'nincompoop', 'doofus',
];
var TAUNTS = [
  'yippee ki yay!', 'go ahead, make my day', 'time to die',
  'say hello to my little friend',
];
var MINOR_THREATS = [
  'threaten to kick a puppy', 'take candy from a baby', 'fart in an elevator',
  'talk really loud on a cellphone in line', 'swear on national televsion',
];
var MID_THREATS = [
  'actually kick a puppy', 'show nudity on national televesion',
  'interrupt taylor swift', 'insult the pope',
];
var BIG_THREATS = [
  'interrupt kanye', 'hijack an airplane', 'take a building hostage',
  'hijack a bus', 'sell sub-prime mortages', 'poison the well',
  'expose national secrets', 'take down youtube',
];
var MEGA_THREATS = [
  'start a war between canada and the us', 'take a city hostage',
  'be, like, really evil', 'blow up a space station',
  'use a space laser', 'bring back parachute pants',
  'air another season of survivor',
];

var Villain = function(ui) {
  this.funds = 50;
  this.evilness = 0;
  this.props = [Levels.WAREHOUSE, Levels.WAREHOUSE, Levels.WAREHOUSE];
  this.ui = ui;
  this.updateUi();
};

Villain.prototype.updateUi = function() {
  var lairs = {};
  var warn = false;
  for (var i = 0; i < this.props.length; ++i) {
    lairs[this.props[i]] = (lairs[this.props[i]] || 0) + 1;
  }
  var lairStr = [];
  for (var kind in lairs) {
    var amt = lairs[kind];
    lairStr.push(amt + ' ' + kind + (amt == 1 ? '' : 's'));
  }
  lairStr = lairStr.join(', ');
  if (!lairStr) {
    lairStr = 'no more real estate! buy some or lose!';
    warn = true;
  }
  var disps = this.ui.selectAll('div.disp').data([
    ['funds', this.funds.toFixed(2)],
    ['evilness', this.evilness],
    ['evil lairs', lairStr, warn],
  ]);
  var txt = function(d) {
    return d[0] + ': ' + d[1];
  };
  disps.enter().append('div')
      .attr('class', 'disp')
      .text(txt);
  disps
      .classed('warn', function(d) { return !!d[2]; })
      .text(txt);
};

Villain.prototype.spend = function(amt) {
  this.funds -= amt;
  this.updateUi();
};

Villain.prototype.villify = function(amt) {
  this.evilness += amt;
  this.updateUi();
};

Villain.prototype.addProp = function(prop) {
  this.props.push(prop);
  this.updateUi();
};

Villain.prototype.popProp = function(prop) {
  var p = null;
  if (this.props.length) {
    p = pickPop(this.props);
  }
  this.updateUi();
  return p;
};

var Ignore = {
  MOOK: 1 << 0,
  HERO: 1 << 1,
  BULLET: 1 << 2,
};

var BuildGame = function(owner) {
  this.owner = d3.select(owner);
  BuildGame.GAME = this;
  this.newGame();
};

BuildGame.prototype.newGame = function() {
  this.day = 0;
  this.levelOver();
  ShootGame.GAME.addParticle(new FloatText(
      'bad budes v. bad dude',
      320, 240,
      {t: 5, color: '#fff', font: '26 Helvetica'}));
};

BuildGame.prototype.makeHtml = function() {
  owner = this.owner;

  var fortifyThings = [
    {name: 'thug [knife]', clazz: Mook.KNIFE},
    {name: 'thug [gun]', clazz: Mook.GUN},
    {name: 'thug [shotgun]', clazz: Mook.SHOTGUN},
    {name: 'turret [bullets]', clazz: Mook.TURRET},
    {name: 'turret [laser]', clazz: Mook.LASER_TURRET},
  ];
  var fortifyClick = function(o) {
    var bs = owner.select('.sub').selectAll('button.subAction')
        .data(fortifyThings);
    bs.exit().remove();
    bs.enter().append('button')
        .attr('class', 'subAction');
    bs
        .classed('selected', false)
        .text(function(d) { return d.name + ' - $' + d.clazz.price; });

    bs.on('click', function(d) {
      ShootGame.GAME.levelEdit_.listen(RENDERER.elem(), d.clazz);
      bs.classed('selected', false);
      d3.select(this).classed('selected', true);
    });
  };
  var fortifyUnclick = function(o) {
    ShootGame.GAME.levelEdit_.unlisten(RENDERER.elem());
  };

  var blackMarketThings = [
    Levels.WAREHOUSE,
    Levels.SUBYARD,
    Levels.LAB,
    Levels.MOON,
  ];
  var blackMarketClick = bind(function(o) {
    var bs = owner.select('.sub').selectAll('button.subAction')
        .data(blackMarketThings);
    bs.exit().remove();
    bs.enter().append('button')
        .attr('class', 'subAction');
    bs
        .classed('selected', false)
        .text(function(d) { return d + ' $' + Levels.Data[d].price; });

    bs.on('click', bind(function(d) {
      var ld = Levels.Data[d];
      if (ShootGame.GAME.villain_.funds >= ld.price) {
        ShootGame.GAME.villain_.spend(ld.price);
        ShootGame.GAME.villain_.villify(ld.evil);
        ShootGame.GAME.villain_.addProp(d);

        ShootGame.GAME.addParticle(new FloatText(
            'sweet new "' + d + '"!',
            320, 430,
            {dy: -10, color: '#fff', font: '12px Helvetica'}));
        ShootGame.GAME.addParticle(new FloatText(
            '-$' + ld.price,
            320, 450,
            {dy: -10, color: '#34ab1c'}));
        ld.price = Math.ceil(ld.price * 1.1);
        bs
            .text(function(d) { return d + ' $' + Levels.Data[d].price; });
      } else {
        ShootGame.GAME.addParticle(new FloatText(
            'no $',
            320, 450,
            {dy: -10, color: '#ab1c1c'}));
      }
    }, this));
  }, this);

  var demandClick = bind(function(o) {
    var bs = owner.select('.sub').selectAll('button.subAction')
        .data(this.demands);
    bs.exit().remove();
    bs.enter().append('button')
        .attr('class', 'subAction');
    bs
        .classed('selected', false)
        .text(function(d) { return d.n; });

    var self = this;
    bs.on('click', function(d) {
      ShootGame.GAME.villain_.spend(-d.v);
      d3.select(this).remove();
      self.demands.splice(self.demands.indexOf(d), 1);

      ShootGame.GAME.addParticle(new FloatText(
          'you monster! we can\'t let you',
          320, 420,
          {t: 3, dy: -50, color: '#fff', font: '12px Helvetica'}));
      ShootGame.GAME.addParticle(new FloatText(
          d.n,
          320, 432,
          {t: 3, dy: -50, color: '#fff', font: '12px Helvetica'}));
      ShootGame.GAME.addParticle(new FloatText(
          '+$' + d.v,
          320, 444,
          {t: 3, dy: -50, color: '#34ab1c', font: '12px Helvetica'}));
    });
  }, this);

  var endDayClick = function() {
    ShootGame.GAME.play();
    owner.select('.sub').selectAll('button.subAction').remove();
    owner.selectAll('button').style('display', 'none');
  };

  var buttons = [
    {name: 'fortify lair', unclick: fortifyUnclick, click: fortifyClick, sub: true},
    {name: 'buy real estate', click: blackMarketClick, sub: true},
    {name: 'make demands', click: demandClick, sub: true},
    {name: 'let the hero into the lair. it makes sense, trust me.', click: endDayClick},
  ];

  var bs = owner.select('.left').selectAll('button.action')
      .data(buttons)
  bs.exit().remove();
  bs.enter().append('button')
      .attr('class', 'action');
  bs
      .text(function(d) { return d.name; });
  var last = null;
  bs.on('click', function(d) {
    bs.classed('selected', false);
    if (d.click) {
      ShootGame.GAME.renderLevel = true;
      d.click(d);
      if (last && last != d && last.unclick) {
        last.unclick();
      }
      if (d.sub) {
        d3.select(this).classed('selected', true);
      }
      last = d;
    } else {
      owner.select('.sub').selectAll('button.subAction').remove();
    }
  });
};

BuildGame.prototype.levelOver = function() {
  var possibleDemands = [{o: MINOR_THREATS.slice(), v: 12, c: 0}];
  if (ShootGame.GAME.villain_.evilness >= 30) {
    possibleDemands.push({o: MID_THREATS.slice(), v: 90, c: 30});
  }
  if (ShootGame.GAME.villain_.evilness >= 80) {
    possibleDemands.push({o: BIG_THREATS.slice(), v: 120, c: 80});
  }
  if (ShootGame.GAME.villain_.evilness >= 250) {
    possibleDemands.push({o: MEGA_THREATS.slice(), v: 290, c: 250});
  }
  this.demands = [];
  var i = possibleDemands.length - 1;
  var ev = ShootGame.GAME.villain_.evilness;
  while (this.demands.length < 4) {
    var pd = possibleDemands[i];
    this.demands.unshift({n: pickPop(pd.o), v: pd.v});
    ev -= pd.c;
    if (ev < pd.c) i -= 1;
    if (i < 0) i = 0;
  }

  ShootGame.GAME.renderLevel = false;
  this.owner.selectAll('button').style('display', 'inherit');
  this.day++;
  var nextKind = ShootGame.GAME.villain_.popProp();
  if (nextKind) {
    var numFloors = [1];
    for (var i = 0; i < this.day; ++i) numFloors.push(1);
    for (var i = 0; i < this.day / 2; ++i) numFloors.push(2);
    for (var i = 4; i < this.day; ++i) numFloors.push(2);
    for (var i = 6; i < this.day; i += 0.5) numFloors.push(3);
    for (var i = 8; i < this.day; i += 0.4) numFloors.push(4);
    ShootGame.GAME.setLevel(
        Level.randomOfHeight(pick(numFloors), nextKind));
    var p = new FloatText(
        'DAY ' + this.day,
        320, 50,
        {t: 5, dy: -10, color: '#fff', font: '18px Helvetica'});
    var ot = bind(p.tick, p);
    p.tick = function(t) { ot(t); if (this.dead) ShootGame.GAME.renderLevel = true; };
    ShootGame.GAME.addParticle(p);
    ShootGame.GAME.addParticle(new FloatText(
        'bad-enough dudes invading our',
        320, 70,
        {t: 5, dy: -10, color: '#fff', font: '12px Helvetica'}));
    ShootGame.GAME.addParticle(new FloatText(
        nextKind,
        320, 82,
        {t: 5, dy: -10, color: '#fff', font: '12px Helvetica'}));
    ShootGame.GAME.hero_.maxSpeed = 70 + 2 * this.day;
    ShootGame.GAME.hero_.setShotDelay(Math.max(0.5, 2 - this.day * 0.1));
  } else {
    ShootGame.GAME.addParticle(new FloatText(
        'snap! you\'ve run out of lairs to conveniently leave poorly defended',
        320, 50,
        {t: Infinity, color: '#fff', font: '18px Helvetica'}));
    ShootGame.GAME.addParticle(new FloatText(
        'oh well, game over i guess',
        320, 80,
        {t: Infinity, color: '#fff', font: '14px Helvetica'}));
    ShootGame.GAME.addParticle(new FloatText(
        'you can press "n" to start again',
        320, 100,
        {t: Infinity, color: '#fff', font: '14px Helvetica'}));
    var p = new Particle(Infinity);
    p.tick = function() {
      if (KB.keyPressed('n')) {
        shootGame.newGame();
        buildGame.newGame();
      }
    };
    ShootGame.GAME.addParticle(p);
  }
};

var LevelEdit = function(game) {
  this.game = game;
};

LevelEdit.prototype.handleEvent = function(e) {
  if (!this.game.level_) return;
  if (!this.piece) return;
  this.bx = e.layerX / (1.25 * Block.SIZE);
  this.by = e.layerY / (1.25 * Block.SIZE);
  var facing = this.bx % 1 > 0.5 ? 1 : -1;
  this.bx = Math.floor(this.bx);
  this.by = Math.floor(this.by);
  var w = this.piece.collider_.w();
  var h = this.piece.collider_.h();
  if (e.type == 'mousemove') {
    this.piece.facing = facing;
    this.piece.collider_.aabb.setXY(
      this.bx * Block.SIZE + (Block.SIZE - w) / 2,
      this.by * Block.SIZE + (Block.SIZE - h) / 2);
  } else if (e.type == 'click') {
    if (this.isLegal(this.bx, this.by, this.piece)) {
      if (this.game.villain_.funds >= this.clazz.price) {
        this.game.villain_.spend(this.clazz.price);
        this.game.addParticle(new FloatText(
            '-$' + this.clazz.price,
            this.piece.collider_.cx(), this.piece.collider_.y(),
            {dx: 5, dy: -10, color: '#34ab1c'}));
        this.game.addEnemy(this.piece);
        this.piece = this.clazz.make();
      } else {
        this.game.addParticle(new FloatText(
            'no $',
            this.piece.collider_.cx(), this.piece.collider_.y(),
            {dx: 5, dy: -10, color: '#ab1c1c'}));
      }
    }
  }
};

LevelEdit.prototype.isLegal = function(bx, by, piece) {
  var legal = false;
  var onTopOf = this.game.level_.blockAt(bx * Block.SIZE, by * Block.SIZE);
  if (onTopOf) {
    var onTopBlock = this.game.level_.blockMap_[onTopOf.charCodeAt(0)];
    if (!onTopBlock || !(onTopBlock.collideSides_ & Block.COLLIDE_SIDES)) {
      legal = true;
    }
  }
  var collides = this.piece.collider_.ignore;
  this.piece.collider_.ignore = 0;
  if (legal) {
    var colliders = [this.piece.collider_, this.game.hero_.collider_].concat(
        this.game.ents.map(function(f) { return f.collider_; }));
    Collider.stepAll(colliders, 1);
    legal = !(this.piece.collider_.lastCollision);
  }
  this.piece.collider_.ignore = collides;
  return legal;
};

LevelEdit.prototype.listen = function(elem, clazz) {
  elem.addEventListener('mousemove', this, false);
  elem.addEventListener('click', this, false);
  this.clazz = clazz;
  this.piece = clazz.make();
};

LevelEdit.prototype.unlisten = function(elem) {
  elem.removeEventListener('mousemove', this, false);
  elem.removeEventListener('click', this, false);
  this.piece = null;
  this.clazz = null;
};

LevelEdit.prototype.render = function(renderer) {
  var ctx = renderer.context();
  if (this.piece) {
    this.piece.render(renderer);
    if (this.bx != null) {
      var x = this.bx * Block.SIZE;
      var y = this.by * Block.SIZE;
      ctx.strokeStyle = this.isLegal(this.bx, this.by, this.piece) ? '#0f0' : '#f00';
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
  ShootGame.GAME = this;
  this.newGame();
  this.levelEdit_ = new LevelEdit(this);
};

ShootGame.prototype.newGame = function() {
  this.renderLevel = false;
  this.ticking = false;
  this.villain_ = new Villain(d3.select('#build .funds'));
  this.hero_ = new Hero(Block.SIZE + 4, Block.SIZE + 4);
  this.setLevel(null);
  this.t = 0;

};
ShootGame.GAME = null;

ShootGame.addEnt = function(ents, ent) {
  for (var i = 0; i < ents.length; ++i) {
    var curEnt = ents[i];
    if (!curEnt || curEnt.dead) {
      ents[i] = ent;
      return i;
    }
  }
  ents.push(ent);
  return ents.length - 1;
};

ShootGame.prototype.play = function() {
  this.levelEdit_.unlisten(RENDERER.elem());
  this.renderLevel = true;
  document.getElementById('game').focus();
  this.hero_.dead = false;
  this.ticking = true;
};

ShootGame.prototype.addBullet = function(bullet) {
  ShootGame.addEnt(this.bullets, bullet);
};

ShootGame.prototype.addEnt = function(ent) {
  ShootGame.addEnt(this.ents, ent);
};

ShootGame.prototype.addEnemy = function(ent) {
  ShootGame.addEnt(this.ents, ent);
  var ei = ShootGame.addEnt(this.enemies, ent);
  var possessed = this.enemies[this.possessI];
  if (!possessed || possessed.dead) {
    this.possess(ei);
  }
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
  this.ticking = false;
  this.hero_ = new Hero(Block.SIZE + 4, Block.SIZE + 4);
  if (level) {
    this.hero_.collider_.aabb.setXY(level.start[0] * Block.SIZE,
        level.start[1] * Block.SIZE);
  }
  this.level_ = level;

  this.ents = [];
  this.particles = [];
  this.enemies = [];
  this.bullets = [];
  this.possessI = -1;
};

ShootGame.prototype.nextPossess = function(opt_dir) {
  var foundI = -1;
  if (opt_dir) {
    for (var i = 0; i < this.enemies.length; ++i) {
      foundI = this.possessI + opt_dir * (i + 1);
      foundI %= this.enemies.length;
      if (foundI < 0) {
        foundI += this.enemies.length;
      }
      if (this.enemies[foundI] && !this.enemies[foundI].dead) {
        break;
      }
    }
  } else {
    var best = null;
    var bestD = Infinity;
    for (var i = 0; i < this.enemies.length; ++i) {
      var e = this.enemies[i];
      if (e && !e.dead) {
        var dx = e.collider_.cx() - this.hero_.collider_.cx();
        var dy = e.collider_.cy() - this.hero_.collider_.cy();
        var d = dx * dx + dy * dy * 3;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
    }
    if (best) {
      foundI = best;
    }
  }
  if (foundI != this.possessI && foundI >= 0) {
    this.possess(foundI);
  }
};
ShootGame.prototype.possess = function(index) {
  if (this.possessI >= 0 && this.possessI < this.enemies.length) {
    this.enemies[this.possessI].possess(false);
  }
  this.enemies[index].possess(true);
  this.possessI = index;
};

ShootGame.prototype.tick = function(t) {
  this.t += t;
  this.t %= 1000;

  var tickFn = ShootGame.tickEntFn(t);
  this.particles.forEach(tickFn);

  if (KB.keyPressed(Keys.TAB)) {
    this.nextPossess(KB.keyDown(Keys.SHIFT) ? -1 : 1);
  } else if (!this.enemies[this.possessI] || this.enemies[this.possessI].dead) {
    this.nextPossess();
  }

  if (!this.ticking) return;

  this.hero_.tick(t);

  var collide = this.level_.collideEnt(this.hero_, t);
  this.hero_.handleLevelCollide(collide);
  var heroBlock = this.level_.blockAt(
    this.hero_.collider_.cx(), this.hero_.collider_.cy());
  if (/*KB.keyPressed('k') ||*/ (heroBlock && heroBlock == 'o' && !this.hero_.dead)) {
    this.hero_.dead = true;
    var cx = this.hero_.collider_.cx();
    var cy = this.hero_.collider_.cy();
    for (var z = 0; z < 5; ++z) {
      this.addParticle(new Explosion(
          cx + randFlt(-10, 10),
          cy + randFlt(-10, 10),
          randFlt(40, 60), 1));
    }
    this.addParticle(new FloatText(pick(TAUNTS), cx, cy, {
      dx: cx > 320 ? -10 : 10,
      dy: -10,
      align: cx > 320 ? 'right' : 'left',
      color: '#fff',
      font: '16px Helvetica',
    }));

    this.addParticle(new NextLevelParticle());
  }

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

  this.ents.forEach(tickFn);
  this.bullets.forEach(tickFn);

  var collides = this.bullets.concat(this.enemies).concat([this.hero_])
      .filter(function(f) { return !f.dead; })
      .map(function(f) { return f.collider_; });
  Collider.stepAll(collides, t);
  this.bullets.forEach(function(bullet) {
    if (!bullet.dead) {
      if (bullet.collider_.lastCollision) {
        bullet.dead = true;
        if (bullet.collider_.ignore & Ignore.MOOK) {
          this.hero_.collider_.vx +=
              sgn(bullet.collider_.vx) * this.hero_.maxSpeed * 0.4 * bullet.collider_.damage / 5;
          var amount = bullet.collider_.damage || 1;
          this.hero_.subShotDelay(bullet.collider_.damage * 0.02);
          this.villain_.spend(-amount);
          this.addParticle(new FloatText(
              '+$' + amount,
              bullet.collider_.cx(), bullet.collider_.y(),
              {dx: randFlt(-10, 10), dy: -50, color: '#34ab1c'}));
        }
      }
    }
  }, this);
  this.enemies.forEach(function(enemy) {
    if (!enemy.dead) {
      if (enemy.collider_.lastCollision) {
        if (enemy.hitBy(enemy.collider_.lastCollision.damage || 1)) {
          this.addParticle(new DeathFall(enemy, '#f56f58',
              sgn(enemy.collider_.lastCollision.object.vx)));
          this.ticking = false;
          var ft = new FloatText(
            [pick(FIRSTS), pick(LASTS), '-', pick(DESCRIPTS)].join(' '),
            enemy.collider_.cx(), enemy.collider_.y() - 5,
            {dy: -10, color: '#ccc', font: '12px Helvetica', t: 1.2});
          var ot = bind(ft.tick, ft);
          ft.tick = function(t) {
            ot(t);
            ShootGame.GAME.ticking = this.dead;
          };
          this.addParticle(ft);
        }
      }
    }
  }, this);

  //Collider.stepAll([this.hero_.collider_], t);
};

ShootGame.prototype.render = function(renderer) {
  var ctx = renderer.context();
  if (this.renderLevel) {
    this.level_.render(renderer);
  }
  var renderFn = ShootGame.renderEntFn(renderer);
  this.particles.forEach(renderFn);
  if (this.renderLevel) {
    this.ents.forEach(renderFn);
    this.bullets.forEach(renderFn);
    this.hero_.render(renderer);
  }

  this.levelEdit_.render(renderer);

  var possessed = this.enemies[this.possessI];
  if (possessed && !possessed.dead) {
    var h = this.t % 1;
    h = h * 4 - 2;
    h = -h * h + 1;
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(possessed.collider_.cx() - 5, possessed.collider_.y() - 5 + h);
    ctx.lineTo(possessed.collider_.cx() + 5, possessed.collider_.y() - 5 + h);
    ctx.lineTo(possessed.collider_.cx(), possessed.collider_.y() + h);
    ctx.closePath();
    ctx.fill();
  }
};

Controller = function() {
};

Controller.prototype.tick = function(t) {};
Controller.prototype.left = function() { return false; }
Controller.prototype.right = function() { return false; }
Controller.prototype.jump = function() { return false; }
Controller.prototype.shoot = function() { return false; }

var MookController = function(actor) {
  baseCtor(this);
  this.actor = actor;
  this.offset = randFlt(0.1, 0.2);
};
inherit(MookController, Controller);
MookController.prototype.tick = function(t) {
  this.offset -= t;
  if (this.offset < 0) {
    this.offset += 0.2;
    var mx = this.actor.collider_.cx();
    var hx = ShootGame.GAME.hero_.collider_.cx();
    var my = this.actor.collider_.cy();
    var hy = ShootGame.GAME.hero_.collider_.cy();
    if (Level.whichFloor(my) <= Level.whichFloor(hy)) {
      if (Level.whichFloor(my) < Level.whichFloor(hy)) {
        this.doleft = Level.whichFloor(my) % 2 == 1;
        this.doright = !this.doleft;
        this.dojump = true;
        this.doshoot = false;
      } else {
        this.doleft = hx < mx;
        this.doright = !this.doleft;
        this.dojump = false;
        this.doshoot = true;
      }
    } else {
      this.doleft = this.doright = this.dojump = this.doshoot = false;
    }
  }
};
MookController.prototype.left = function() { return this.doleft; }
MookController.prototype.right = function() { return this.doright; }
MookController.prototype.jump = function() { return this.dojump; }
MookController.prototype.shoot = function() { return this.doshoot; }

var AiController = function(actor) {
  baseCtor(this);
  this.actor = actor;
  this.dir = 0;
  this.doJump = false;
};
inherit(AiController, Controller);

AiController.prototype.tick = function(t) {
  this.doJump = false;
  var block = ShootGame.GAME.level_.blockAt(
      this.actor.collider_.cx(), this.actor.collider_.cy());
  if (block == '>') {
    this.dir = 1;
  } else if (block == '<') {
    this.dir = -1;
  } else if (block == '^') {
    this.doJump = true;
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

var Bullet = function(x, y, facing, opts) {
  opts = transformOpts(opts);
  var w = opts.w || 4;
  var h = opts.h || 4;
  var vx = facing * (opts.vx || 160 * 1.5);
  var vy = opts.vy || 0;
  this.collider_ = Collider.fromCenter(x, y, w, h, vx, vy);
  this.collider_.ignore = opts.ignore;
  this.collider_.damage = opts.damage || 1;
  this.life = opts.life || Infinity;
  this.c = opts.c || '#666';
};

Bullet.prototype.tick = function(t) {
  this.life -= t;
  if (this.life < 0) {
    this.dead = true;
  }
};

Bullet.prototype.handleLevelCollide = function(collide) {
  this.collider_.aabb.setXY(collide.x, collide.y);
  if (collide.yl || collide.yh || collide.xl || collide.xh) {
    this.dead = true;
  }
};

Bullet.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.fillStyle = this.c;
  ctx.fillRect(this.collider_.x(), this.collider_.y(),
               this.collider_.w(), this.collider_.h());
};

var Actor = function(x, y, w, h, opt_opts) {
  this.opts = transformOpts(opt_opts);
  this.life = this.opts.life || 1;
  this.collider_ = Collider.fromCenter(x, y, w, h, 0, 0);
  this.jumping = 0;
  this.falling = 1;
  this.facing = 1;
  this.controller = new Controller();
  this.nextShot = 0;

  this.opts.shotDelay = this.opts.shotDelay || 0.2;
  this.maxSpeed = (this.opts.maxSpeed == null) ? 80 : this.opts.maxSpeed;
  this.jumpDelta = (this.opts.jumpDelta == null) ? 110 : this.opts.jumpDelta;
};

Actor.prototype.hitBy = function(damage) {
  this.life -= damage;
  if (this.life <= 0) {
    this.dead = true;
  }
  return this.dead;
};

Actor.prototype.tick = function(t) {
  this.controller.tick(t);
  this.nextShot -= t;
  var down = false;
  if (this.controller.left()) {
    this.facing = -1;
    this.collider_.vx -= this.maxSpeed * t;
    down = true;
  }
  if (this.controller.right()) {
    this.facing = 1;
    this.collider_.vx += this.maxSpeed * t;
    down = true;
  }
  if (Math.abs(this.collider_.vx) > this.maxSpeed) {
    this.collider_.vx = sgn(this.collider_.vx) * this.maxSpeed;
  } else if (Math.abs(this.collider_.vx) > t * 0.5 * this.maxSpeed) {
    this.collider_.vx -= sgn(this.collider_.vx) * this.maxSpeed * 0.5 * t;
  } else if (!down) {
    this.collider_.vx = 0;
  }

  if (this.controller.jump()) {
    if (!this.jumping) {
      this.jumping = true;
      this.collider_.vy = -this.jumpDelta;
    }
  }
  if (this.falling) {
    this.collider_.vy += 160 * t;
  }

  if (this.controller.shoot() && this.nextShot < 0) {
    this.nextShot = this.opts.shotDelay;
    var num = this.opts.numBullets || 1;
    for (; num > 0; --num) {
      ShootGame.GAME.addBullet(new Bullet(
          this.collider_.cx(),
          this.collider_.cy(),
          this.facing,
          this.opts.bullet));
    }
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
    bullet: {
      ignore: Ignore.HERO | Ignore.BULLET,
      w: 8,
      h: 2,
      c: '#fff',
    },
  });

  this.initDelay = this.opts.shotDelay;

  this.collider_.ignore = Ignore.HERO;
  this.controller = new AiController(this);
};
inherit(Hero, Actor);

Hero.prototype.tick = function(t) {
  base(this, 'tick', t);
  this.lasthit -= t;
  if (this.opts.shotDelay < this.initDelay) {
    var diff = this.initDelay - this.opts.shotDelay;
    if (diff < this.initDelay * 0.01 && this.lasthit < 0) {
      this.opts.shotDelay = this.initDelay;
    } else {
      this.opts.shotDelay += diff * 0.05 * t;
    }
  }
  this.opts.shotDelay = Math.min(this.opts.shotDelay, this.initDelay);
};

Hero.prototype.setShotDelay = function(amt) {
  this.opts.shotDelay = amt;
  this.initDelay = amt;
};


Hero.prototype.subShotDelay = function(amt) {
  this.lasthit = 1;
  this.opts.shotDelay -= amt;
  this.opts.shotDelay = Math.max(0.05, this.opts.shotDelay);
};

Hero.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.fillStyle = '#659f58';
  ctx.fillRect(this.collider_.x(), this.collider_.y(),
               this.collider_.w(), this.collider_.h());
};

var Mook = function(x, y, opt_opts) {
  var opts = transformOpts(opt_opts);
  opts.bullet = opts.bullet || {};
  opts.bullet.ignore = Ignore.MOOK | Ignore.BULLET;
  baseCtor(this, x, y, opts.w || 8, opts.h || 15, opts);
  this.collider_.ignore = Ignore.MOOK;
  this.possessed = false;
  this.controller = new MookController(this);
};
inherit(Mook, Actor);

Mook.KNIFE = {
  price: 1,
  make: function() {
    return new Mook(-100, -100, {
      shotDelay: 0.2,
      bullet: {
        life: 0.1,
        damage: 5,
        maxSpeed: 80,
        vx: 180,
        w: 10,
      },
    });
  },
};
Mook.GUN = {
  price: 3,
  make: function() {
    return new Mook(-100, -100, {
      shotDelay: 1,
      damage: 4,
      maxSpeed: 30,
    });
  },
};
Mook.SHOTGUN = {
  price: 8,
  make: function() {
    return new Mook(-100, -100, {
      shotDelay: 1,
      numBullets: 5,
      maxSpeed: 30,
      life: 2,
      bullet: {
        vx: partial(randFlt, 150, 180),
        vy: partial(randFlt, -10, 10),
        damage: 1,
        w: 10,
      },
    });
  },
};
Mook.TURRET = {
  price: 8,
  make: function() {
    var turret = new Turret(-100, -100, {
      maxSpeed: 0,
      jumpDelta: 0,
      w: 14,
      h: 16,
      shotDelay: 0.2,
      life: 5,
      bullet: {
        vx: partial(randFlt, 150, 180),
        vy: partial(randFlt, -10, 10),
        damage: 1,
        w: 10,
        h: 2,
      },
    });
    turret.controller.shoot = function() { return true; };
    return turret;
  },
};
Mook.LASER_TURRET = {
  price: 150,
  make: function() {
    var turret = new Turret(-100, -100, {
      maxSpeed: 0,
      jumpDelta: 0,
      w: 14,
      h: 16,
      shotDelay: 0.02,
      life: 5,
      bullet: {
        vx: partial(randFlt, 150, 180),
        vy: partial(randFlt, -1, 1),
        damage: 0.3,
        w: 10,
        h: 1.5,
        c: '#a45',
      },
    });
    turret.controller.shoot = function() { return true; };
    return turret;
  },
};

Mook.prototype.possess = function(doPossess) {
  if (doPossess == this.possessed) {
    return;
  }
  this.possessed = doPossess;
  if (this.possessed) {
    this.oldController = this.controller;
    this.oldSpeed = this.maxSpeed;
    this.controller = new KbController();
    this.maxSpeed = this.oldSpeed == 0 ? 0 : 80;
  } else {
    this.controller = this.oldController;
    this.maxSpeed = this.oldSpeed;
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

  ctx.fillStyle = '#888';
  ctx.fillRect(this.collider_.cx(), this.collider_.cy() - 2,
               this.collider_.w() * this.facing, 4);
};

var Turret = function(x, y, opt_opts) {
  var opts = opt_opts || {};
  baseCtor(this, x, y, opt_opts);
  this.aim = 0;
};
inherit(Turret, Mook);

Turret.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.fillStyle = '#888';
  ctx.fillRect(this.collider_.x(), this.collider_.y() + 2,
               this.collider_.w(), this.collider_.h() - 6);

  if (this.possessed) {
    ctx.fillStyle = '#f9a494';
  } else {
    ctx.fillStyle = '#f56f58';
  }
  ctx.fillRect(this.collider_.cx(), this.collider_.y(),
               -this.facing * this.collider_.w() / 2, this.collider_.h() - 6);
  ctx.fillRect(this.collider_.cx(), this.collider_.y() + this.collider_.h() - 4,
               -this.facing * this.collider_.w() / 2, 4);

  ctx.fillStyle = '#888';
  ctx.fillRect(this.collider_.cx(), this.collider_.cy() - 2,
               this.collider_.w() * this.facing, 4);

  ctx.fillRect(this.collider_.cx() + this.facing * 6, this.collider_.cy(),
               this.facing * 2, this.collider_.h() / 2);
};


var Particle = function(life) {
  this.life = life;
  this.startLife = life;
};

Particle.prototype.alpha = function() {
  return this.life == Infinity ? 1 : this.life / this.startLife;
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

var NextLevelParticle = function(opt_t) {
  baseCtor(this, opt_t || 1);
  this.done = false;
};
inherit(NextLevelParticle, Particle);

NextLevelParticle.prototype.tick = function(t) {
  base(this, 'tick', t);
  if (this.dead && !this.done) {
    this.done = true;
    BuildGame.GAME.levelOver();
  }
};

var Explosion = function(x, y, r, t) {
  baseCtor(this, t);
  this.x = x;
  this.y = y;
  this.r = r;
  this.color = pick(['#f00', '#f6cb55', '#e5d866']);
};
inherit(Explosion, Particle);

Explosion.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r * (1 - 0.9) + (1 - this.alpha()) * this.r * 0.9, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1;
};

var FloatText = function(text, x, y, opts) {
  opts = transformOpts(opts);
  baseCtor(this, opts.t || 1);
  this.x = x;
  this.y = y;
  this.align = opts.align || 'center';
  this.text = text;
  this.font = opts.font || '18px helvetica';
  this.color = opts.color || '#000';
  this.dx = opts.dx || 0;
  this.dy = opts.dy || 0;
};
inherit(FloatText, Particle);

FloatText.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.save();
  ctx.font = this.font;
  ctx.textAlign = this.align;
  ctx.testBaseline = 'middle';
  ctx.fillStyle = this.color;
  ctx.fillText(this.text,
      this.x + this.dx * (1 - this.alpha()),
      this.y + this.dy * (1 - this.alpha()));
  ctx.restore();
}

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

Block.RENDER_WALL = function(color) {
  return function(renderer, x, y) {
    var ctx = renderer.context();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
  };
};

var Levels = {
  WAREHOUSE: 'totally not shady warehouse',
  SUBYARD: 'submarine yard (subs sold separately)',
  LAB: 'awesome science lab',
  MOON: 'a base! on the moon!',
};

Levels.Data = {};
Levels.Data[Levels.WAREHOUSE] = {price: 100, evil: 10};
Levels.Data[Levels.SUBYARD] = {price: 300, evil: 50};
Levels.Data[Levels.LAB] = {price: 400, evil: 80};
Levels.Data[Levels.MOON] = {price: 1000, evil: 300};

Block.RENDER_CRATE = function(hslColor, opt_a) {
  var a = opt_a || 1;
  var hsl = hslColor.copy();
  var outline = hsl.toRgb().toCssString();
  hsl.l *= 0.85;
  var main = hsl.toRgb().toCssString();
  hsl.l *= 0.7;
  var detail = hsl.toRgb().toCssString();
  return function(renderer, x, y) {
    var ctx = renderer.context();
    ctx.globalAlpha = a;
    ctx.fillStyle = outline;
    ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
    ctx.fillStyle = main;
    ctx.fillRect(x + 2, y + 2, Block.SIZE - 4, Block.SIZE - 4);
    ctx.fillStyle = detail;
    for (var i = 1; i < 3; ++i) {
      ctx.fillRect(x + i * Block.SIZE / 3 - 1, y + 2, 2, Block.SIZE - 4);
    }
    ctx.globalAlpha = 1;
  };
};
Block.RENDER_LIGHT = function(c) {
  c = c || 'rgba(255, 224, 122, 0.5)';
  return function(renderer, x, y) {
    var ctx = renderer.context();
    ctx.fillStyle = '#666';
    ctx.fillRect(x, y, Block.SIZE, 4);

    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + Block.SIZE / 4, y + 4);
    ctx.lineTo(x + 3 * Block.SIZE / 4, y + 4);
    ctx.lineTo(x + 2 * Block.SIZE, y + 2 * Block.SIZE);
    ctx.lineTo(x - Block.SIZE, y + 2 * Block.SIZE);
    ctx.closePath();
    ctx.fill();
  };
};
Block.RENDER_L = function(renderer, x, y) {
  var ctx = renderer.context();
  ctx.fillStyle = '#111';
  ctx.fillRect(x + Block.SIZE / 2, y, Block.SIZE / 2, Block.SIZE);
  ctx.fillRect(x, y + Block.SIZE / 4, Block.SIZE / 2, Block.SIZE / 2);
};
Block.RENDER_R = function(renderer, x, y) {
  var ctx = renderer.context();
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, Block.SIZE / 2, Block.SIZE);
  ctx.fillRect(x + Block.SIZE / 2, y + Block.SIZE / 4, Block.SIZE / 2, Block.SIZE / 2);
};
Block.RENDER_U = function(renderer, x, y) {
  var ctx = renderer.context();
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, Block.SIZE, Block.SIZE / 2);
  ctx.fillRect(x + Block.SIZE / 4, y + Block.SIZE / 2, Block.SIZE / 2, Block.SIZE / 2);
};
Block.RENDER_POST = function(renderer, x, y) {
  var ctx = renderer.context();
  ctx.fillStyle = '#111';
  ctx.fillRect(x + Block.SIZE / 4, y, Block.SIZE / 2, Block.SIZE);
};

var WAREHOUSE_BLOCKS = {
  '1': new Block(Block.RENDER_WALL('#888'), Block.COLLIDE_ALL),

  '#': new Block(Block.RENDER_CRATE(new Hsl(21 / 255, 0.14, 0.43), 0.5),
                 Block.COLLIDE_NONE),

  '2': new Block(Block.RENDER_CRATE(new Hsl(21 / 255, 0.14, 0.43)),
                 Block.COLLIDE_ALL),

  '-': new Block(Block.RENDER_LIGHT(), Block.COLLIDE_TOP),
  '|': new Block(Block.RENDER_POST, Block.COLLIDE_NONE),

  'o': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#1f1';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
       },
       Block.COLLIDE_NONE),

  '>': new Block(Block.RENDER_R, Block.COLLIDE_NONE),
  '<': new Block(Block.RENDER_L, Block.COLLIDE_NONE),
  '^': new Block(Block.RENDER_U, Block.COLLIDE_NONE),
};
var SUBYARD_BLOCKS = {
  '1': new Block(Block.RENDER_WALL('#68a'), Block.COLLIDE_ALL),

  '#': new Block(Block.RENDER_CRATE(new Hsl(115 / 255, 0.14, 0.43), 0.5),
                 Block.COLLIDE_NONE),

  '2': new Block(Block.RENDER_CRATE(new Hsl(115 / 255, 0.14, 0.43)),
                 Block.COLLIDE_ALL),

  '-': new Block(Block.RENDER_LIGHT('rgba(80, 140, 120, 0.2)'), Block.COLLIDE_TOP),
  '|': new Block(Block.RENDER_POST, Block.COLLIDE_NONE),

  'o': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#1f1';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
       },
       Block.COLLIDE_NONE),

  '>': new Block(Block.RENDER_R, Block.COLLIDE_NONE),
  '<': new Block(Block.RENDER_L, Block.COLLIDE_NONE),
  '^': new Block(Block.RENDER_U, Block.COLLIDE_NONE),
};

var LAB_BLOCKS = {
  '1': new Block(Block.RENDER_WALL('#598'), Block.COLLIDE_ALL),

  '#': new Block(Block.RENDER_CRATE(new Hsl(0 / 255, 0.1, 0.47), 0.5),
                 Block.COLLIDE_NONE),

  '2': new Block(Block.RENDER_CRATE(new Hsl(0 / 255, 0.1, 0.47)),
                 Block.COLLIDE_ALL),

  '-': new Block(Block.RENDER_LIGHT('rgba(244, 255, 250, 0.6)'), Block.COLLIDE_TOP),
  '|': new Block(Block.RENDER_POST, Block.COLLIDE_NONE),
  '_': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#3e3932';
         ctx.fillRect(x, y, Block.SIZE, 2);
         ctx.fillRect(x + 2, y, 1, Block.SIZE);
         ctx.fillRect(x + Block.SIZE - 3, y, 1, Block.SIZE);
       },
       Block.COLLIDE_TOP),
  '*': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#69a6c3';
         for (var i = 1; i < 4; i += 2) {
           ctx.beginPath();
           ctx.moveTo(x + i * Block.SIZE / 4 - 1, y + Block.SIZE / 2);
           ctx.lineTo(x + i * Block.SIZE / 4 + 1, y + Block.SIZE / 2);
           ctx.lineTo(x + i * Block.SIZE / 4 + 1, y + Block.SIZE / 2 + 2);
           ctx.lineTo(x + (i + 1) * Block.SIZE / 4, y + Block.SIZE);
           ctx.lineTo(x + (i - 1) * Block.SIZE / 4, y + Block.SIZE);
           ctx.lineTo(x + i * Block.SIZE / 4 - 1, y + Block.SIZE / 2 + 2);
           ctx.closePath();
           ctx.fill();
         }
       },
       Block.COLLIDE_NONE),

  'o': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#1f1';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
       },
       Block.COLLIDE_NONE),

  '>': new Block(Block.RENDER_R, Block.COLLIDE_NONE),
  '<': new Block(Block.RENDER_L, Block.COLLIDE_NONE),
  '^': new Block(Block.RENDER_U, Block.COLLIDE_NONE),
};

var MOON_BLOCKS = {
  '1': new Block(Block.RENDER_WALL('#7a908f'), Block.COLLIDE_ALL),

  '#': new Block(Block.RENDER_CRATE(new Hsl(144 / 255, 0.45, 0.32), 0.5),
                 Block.COLLIDE_NONE),

  '2': new Block(Block.RENDER_CRATE(new Hsl(144 / 255, 0.45, 0.32)),
                 Block.COLLIDE_ALL),

  '-': new Block(Block.RENDER_LIGHT('rgba(244, 255, 250, 0.05)'), Block.COLLIDE_TOP),
  '|': new Block(Block.RENDER_POST, Block.COLLIDE_NONE),

  'o': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = '#1f1';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
       },
       Block.COLLIDE_NONE),

  '>': new Block(Block.RENDER_R, Block.COLLIDE_NONE),
  '<': new Block(Block.RENDER_L, Block.COLLIDE_NONE),
  '^': new Block(Block.RENDER_U, Block.COLLIDE_NONE),
};

BLOCKS = {};
BLOCKS[Levels.WAREHOUSE] = WAREHOUSE_BLOCKS;
BLOCKS[Levels.SUBYARD] = SUBYARD_BLOCKS;
BLOCKS[Levels.LAB] = LAB_BLOCKS;
BLOCKS[Levels.MOON] = MOON_BLOCKS;

for (var k in BLOCKS) {
  var BS = BLOCKS[k];
  for (var b in BS) {
    BS[b.charCodeAt(0)] = BS[b];
  }
}

var DEFAULT_CHUNKS = {
  right: [
    [
      'R----   ----   ----',
      '                   ',
      '                   ',
      '>                 2',
      '>^               o#',
      '>^2222      ^^2222#',
      '111111111111111111d',
    ],
    [
      'R|    |    |     21',
      '--- ^--- ^---   <21',
      '               <221',
      '    221111111111111',
      '    22             ',
      '>   ##       ^222oo',
      '111111111111111dddd',
    ],
    [
      '  ---   ---   ---  ',
      '                   ',
      '                   ',
      '                   ',
      '                   ',
      'R                 o',
      '11111111111111ddddd',
    ],
    [
      '  ---   ---   ---  ',
      '   2               ',
      '   22 2            ',
      '   22 2            ',
      ' ^^####            ',
      'R^22222           o',
      '11111111111111ddddd',
    ],
  ],
  left: [
    [
      ' ----    ----   -- ',
      '                  L',
      '                   ',
      '                   ',
      'o      22^^^    ^^ ',
      'd^^   2222^^  22^^<',
      'd111111111111111111',
    ],
    [
      ' ----    ----   -- ',
      '                  L',
      '              <<   ',
      '              2<   ',
      '       22^^^  2^   ',
      'o     2222^^  22^^<',
      'dddd111111111111111',
    ],
    [
      '  ---   ---   ---  ',
      '                   ',
      '                   ',
      '                   ',
      '                   ',
      'o                 L',
      'dddddd1111111111111',
    ],
  ],
};

SPECIAL_CHUNKS = {
  right: [
    {levels: [Levels.LAB], d: [
      '                   ',
      '                   ',
      '                   ',
      '                   ',
      '  *     *    * *   ',
      'R^_   ^__   ^___  o',
      '1111111111111111ddd',
    ]},
    {levels: [Levels.LAB], d: [
      'R                 2',
      '11111111111  *  *<2',
      '             _  _<2',
      '>111111111111111111',
      '  *     *    * *   ',
      '>^_   ^__   ^___  o',
      '1111111111111111ddd',
    ]},
    {levels: [Levels.MOON], d: [
      '                   ',
      'R  ^      ^        ',
      '1111 |^11111 |     ',
      '   -----   -----   ',
      '                   ',
      '>        o         ',
      '11111111111111ddddd',
    ]},
    {levels: [Levels.MOON], d: [
      'R ---   ---   ---  ',
      '   2               ',
      '   22 2            ',
      '>  22 2     22     ',
      '^^ ####    222     ',
      '^^22222  > ###    o',
      '11111111111111ddddd',
    ]},
  ],
  left: [
    {levels: [Levels.SUBYARD, Levels.MOON], d: [
      '          ####     ',
      '          ####     ',
      '     ^^ <<####<    ',
      '   1>^^11111111    ',
      '   11 ---    --    ',
      'o  11^            L',
      'ddd1111111111111111',
    ]},
    {levels: [Levels.LAB], d: [
      '                   ',
      '                   ',
      '                   ',
      '                   ',
      '  * *         **   ',
      'o _ _^ _  ^   __^ L',
      'dd11111111111111111',
    ]},
    {levels: [Levels.LAB], d: [
      'o          < 11L   ',
      'd1111111111<<11>   ',
      'd         > ^11>   ',
      'd>^^1111111111111  ',
      'd1^--   *    * *  <',
      'd111^ <__ <  ___  <',
      'd111111111111111111',
    ]},
  ],
};

(function() {
  var verifyChunk = function(chunk, entrance) {
    var patterns = {'o': 0, 'd': 1};
    patterns[entrance] = 0;
    for (var line = 0; line < chunk.length; ++line) {
      for (var p in patterns) {
        if (chunk[line].indexOf(p) != -1) {
          patterns[p] += 1;
        }
      }
    }
    for (var p in patterns) {
      if (patterns[p] == 0) {
        throw Error('bad ' + p);
      }
    }
  };
  for (var kind in DEFAULT_CHUNKS) {
    var chunks = DEFAULT_CHUNKS[kind];
    for (var i = 0; i < chunks.length; ++i) {
      verifyChunk(chunks[i], kind == 'right' ? 'R' : 'L');
    }
  }
  for (var kind in SPECIAL_CHUNKS) {
    var chunks = SPECIAL_CHUNKS[kind];
    for (var i = 0; i < chunks.length; ++i) {
      verifyChunk(chunks[i].d, kind == 'right' ? 'R' : 'L');
    }
  }
})();

Level.randomOfHeight = function(floors, kind) {
  var dir = 1;
  var roof = '1111111111111111111111111111111111111111';
  var lines = [roof];
  var first = true;
  for (; floors > 0; --floors) {
    var norm = dir > 0 ? 'right' : 'left';
    var blocks = DEFAULT_CHUNKS[norm];
    var sb = SPECIAL_CHUNKS[norm]
        .filter(function(d) { return d.levels.indexOf(kind) != -1; })
        .map(function(d) { return d.d; });
    blocks = blocks.concat(sb);
    var leftHalf = pick(blocks);
    var rightHalf = pick(blocks);
    if (!first) {
      leftHalf = leftHalf.map(function(f) {
        return f.replace(/L/g, '<').replace(/R/g, '>');
      });
    }
    if (floors != 1) {
      rightHalf = rightHalf.map(function(f) {
        return f.replace(/[od]/g, ' ');
      });
    } else {
      rightHalf = rightHalf.map(function(f) {
        return f.replace(/d/g, '1');
      });
    }
    rightHalf = rightHalf.map(function(f) {
      return f.replace(/L/g, '<').replace(/R/g, '>');
    });
    leftHalf = leftHalf.map(function(f) {
      return f.replace(/o/g, ' ').replace(/d/g, '1');
    });
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
    first = false;
  }
  var str = lines.join('\n') + '\n';

  return Level.loadFromString(str, BLOCKS[kind]);
};

function Level(blocks, blockMap) {
  this.blocks_ = blocks;
  this.blockMap_ = blockMap;
};

Level.whichFloor = function(y) {
  var BLOCKS_PER_FLOOR = 7;
  var ROOF_H = 1;
  var by = y / Block.SIZE - ROOF_H;
  return Math.floor(by / BLOCKS_PER_FLOOR);
};

Level.loadFromString = function(str, blockMap) {
  var blocks = [];
  var rowLen = -1;
  var lineNum = 1;
  var start = null;
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
      if (code == 'L'.charCodeAt(0)) {
        code = '<'.charCodeAt(0);
        start = [, blocks.length];
      } else if (code == 'R'.charCodeAt(0)) {
        code = '>'.charCodeAt(0);
        start = [i, blocks.length];
      }
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
  var level= new Level(blocks, blockMap);
  level.start = start;
  return level;
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
