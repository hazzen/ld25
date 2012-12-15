var ShootGame = function() {
  this.hero_ = new Hero(50, 50);
};

ShootGame.prototype.setLevel = function(level) {
  this.level_ = level;
};

ShootGame.prototype.tick = function(t) {
  this.hero_.tick(t);

  var collide = this.level_.collideEnt(this.hero_, t);
  this.hero_.asCollider().aabb.setXY(collide.x, collide.y);
  if (collide.yl || collide.yh) {
    if (this.hero_.asCollider().vy >= 0) {
      this.hero_.falling = 0;
      this.hero_.jumping = 0;
    }
    this.hero_.asCollider().vy = 0;
  } else {
    this.hero_.falling = 1;
  }
  if (collide.xl || Collider.xh) {
    this.hero_.asCollider().vx = 0;
  }

  //Collider.stepAll([this.hero_.collider_], t);
};

ShootGame.prototype.render = function(renderer) {
  this.level_.render(renderer);
  this.hero_.render(renderer);
};

var Hero = function(x, y) {
  this.collider_ = Collider.fromCenter(x, y, 8, 16, 0, 0);
  this.jumping = 0;
  this.falling = 1;
};

Hero.prototype.asCollider = function() {
  return this.collider_;
};

Hero.prototype.tick = function(t) {
  var down = false;
  if (KB.keyDown('a')) {
    this.collider_.vx -= t * 160;
    down = true;
  }
  if (KB.keyDown('d')) {
    this.collider_.vx += t * 160;
    down = true;
  }
  if (Math.abs(this.collider_.vx) > 160) {
    this.collider_.vx = sgn(this.collider_.vx) * 160;
  } else if (Math.abs(this.collider_.vx) > 0.01) {
    this.collider_.vx -= sgn(this.collider_.vx) *
        Math.min(t * 50, Math.abs(this.collider_.vx));
  } else if (!down) {
    this.collider_.vx = 0;
  }

  if (KB.keyPressed(Keys.COMMA)) {
    if (!this.jumping) {
      this.jumping = true;
      this.collider_.vy = -130;
    }
  }
  if (this.falling) {
    this.collider_.vy += 160 * t;
  }
};

Hero.prototype.render = function(renderer) {
  var ctx = renderer.context();
  ctx.fillStyle = '#659f58';
  ctx.fillRect(this.collider_.x(), this.collider_.y(),
               this.collider_.w(), this.collider_.h());
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

  '2': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = 'rgb(0, 128, 0)';
         ctx.fillRect(x, y, Block.SIZE, Block.SIZE);
       },
       Block.COLLIDE_ALL),

  '-': new Block(function(renderer, x, y) {
         var ctx = renderer.context();
         ctx.fillStyle = 'rgb(128, 128, 128)';
         ctx.fillRect(x, y, Block.SIZE, 4);
       },
       Block.COLLIDE_TOP)
};

for (var b in DEFAULT_BLOCKS) {
  DEFAULT_BLOCKS[b.charCodeAt(0)] = DEFAULT_BLOCKS[b];
}

var DEFAULT_LEVEL = (
  '111111111111111111111\n' +
  '1                   1\n' +
  '1  ---     -----    1\n' +
  '1                   1\n' +
  '1      ---          1\n' +
  '1                   1\n' +
  '1  2222        222221\n' +
  '111111111111111111111\n');

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
  var collider = ent.asCollider();
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
  var c = ent.asCollider();
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
