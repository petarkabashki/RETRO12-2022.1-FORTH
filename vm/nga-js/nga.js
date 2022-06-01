/* Nga ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   Copyright (c) 2008 - 2019, Charles Childers
   Copyright (c) 2009 - 2010, Luke Parrish
   Copyright (c) 2010,        Marc Simpson
   Copyright (c) 2010,        Jay Skeer
   Copyright (c) 2011,        Kenneth Keating
   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

var IMAGE_SIZE = 524288;    /* Amount of simulated RAM    */
var DATA_DEPTH = 8192;      /* Depth of data stack        */
var ADDRESS_DEPTH = 32768;  /* Depth of the stacks        */

var framebuffer = 0;

function Stack(size) {
  this.sp = 0;
  this.data = new Array(size);
  this.push = function(n) {
    this.sp++;
    this.data[this.sp] = n;
  }
  this.pop = function() {
    return this.data[this.sp--];
  }
  this.depth = function() {
    return this.sp;
  }
  this.tos = function() {
    return this.data[this.sp];
  }
  this.nos = function() {
    return this.data[this.sp - 1];
  }
  this.dup = function() {
    this.push(this.tos());
  }
  this.drop = function() {
    this.sp--;
  }
  this.swap = function() {
    var a = this.nos();
    this.data[this.sp - 1] = this.tos();
    this.data[this.sp] = a;
  }
  this.inc = function() {
    this.data[this.sp]++;
  }
  this.dec = function() {
    this.data[this.sp]--;
  }
  this.reset = function() {
    this.sp = 0;
  }
}

function Opcodes() {
  this.NOP = 0;
  this.LIT = 1;
  this.DUP = 2;
  this.DROP = 3;
  this.SWAP = 4;
  this.PUSH = 5;
  this.POP = 6;
  this.JUMP = 7;
  this.CALL = 8;
  this.CCALL = 9;
  this.RETURN = 10;
  this.EQ = 11;
  this.NEQ = 12;
  this.LT = 13;
  this.GT = 14;
  this.FETCH = 15;
  this.STORE = 16;
  this.ADD = 17;
  this.SUB = 18;
  this.MUL = 19;
  this.DIVMOD = 20;
  this.AND = 21;
  this.OR = 22;
  this.XOR = 23;
  this.SHIFT = 24;
  this.ZERO_EXIT = 25;
  this.HALT = 26;
  this.IE = 27;
  this.IQ = 28;
  this.II = 29;
}
var ip = 0;
var data = new Stack(DATA_DEPTH);
var address = new Stack(ADDRESS_DEPTH);
var image = new Array(IMAGE_SIZE);
var vm = new Opcodes();
var instructions = new Array(vm.II + 1);
var notfound = 0;
var interpret = 0;

function rxPrepareVM() {
  ip = 0;
  data.reset();
  address.reset();
  framebuffer = 0;
}

instructions[vm.NOP] = function() {}
instructions[vm.LIT] = function() {
  ip++;
  data.push(image[ip]);
}
instructions[vm.DUP] = function() {
  data.dup();
}
instructions[vm.DROP] = function() {
  data.drop();
}
instructions[vm.SWAP] = function() {
  data.swap();
}
instructions[vm.PUSH] = function() {
  address.push(data.pop());
}
instructions[vm.POP] = function() {
  data.push(address.pop())
}
instructions[vm.JUMP] = function() {
  ip = data.pop() - 1;
}
instructions[vm.CALL] = function() {
  address.push(ip);
  ip = data.pop() - 1;
}
instructions[vm.CCALL] = function() {
  var a, b;
  a = data.pop();
  b = data.pop();
  if (b != 0) {
    address.push(ip);
    ip = a - 1;
  }
}
instructions[vm.RETURN] = function() {
  ip = address.pop();
}
instructions[vm.EQ] = function() {
  var a, b;
  a = data.pop();
  b = data.pop();
  if (b == a)
    data.push(-1);
  else
    data.push(0);
}
instructions[vm.NEQ] = function() {
  var a, b;
  a = data.pop();
  b = data.pop();
  if (b != a)
    data.push(-1);
  else
    data.push(0);
}
instructions[vm.LT] = function() {
  var a, b;
  a = data.pop();
  b = data.pop();
  if (b < a)
    data.push(-1);
  else
    data.push(0);
}
instructions[vm.GT] = function() {
  var a, b;
  a = data.pop();
  b = data.pop();
  if (b > a)
    data.push(-1);
  else
    data.push(0);
}
instructions[vm.FETCH] = function() {
  x = data.pop();
  if (x == -1)
    data.push(data.sp);
  else if (x == -2)
    data.push(address.sp);
  else if (x == -3)
    data.push(IMAGE_SIZE);
  else if (x == -4)
    data.push(-2147483648);
  else if (x == -5)
    data.push(2147483647);
  else
    data.push(image[x]);
}
instructions[vm.STORE] = function() {
  image[data.tos()] = data.nos();
  data.drop();
  data.drop();
}
instructions[vm.ADD] = function() {
  var x = data.pop();
  var y = data.pop();
  data.push(x + y);
}
instructions[vm.SUB] = function() {
  var x = data.pop();
  var y = data.pop();
  data.push(y - x);
}
instructions[vm.MUL] = function() {
  var x = data.pop();
  var y = data.pop();
  data.push(y * x);
}
instructions[vm.DIVMOD] = function() {
  var b = data.pop();
  var a = data.pop();
  if (b == 0) {
    ip = 0;
    data.sp = 0;
    address.sp = 0;
  } else {
    var x = Math.abs(b);
    var y = Math.abs(a);
    var q = Math.floor(y / x);
    var r = y % x;
    if (a < 0 && b < 0)
      r = r * -1;
    if (a > 0 && b < 0)
      q = q * -1;
    if (a < 0 && b > 0) {
      r = r * -1;
      q = q * -1;
    }
    data.push(r);
    data.push(q);
  }
}
instructions[vm.AND] = function() {
  var x = data.pop();
  var y = data.pop();
  data.push(x & y);
}
instructions[vm.OR] = function() {
  var x = data.pop();
  var y = data.pop();
  data.push(x | y);
}
instructions[vm.XOR] = function() {
  var x = data.pop();
  var y = data.pop();
  data.push(x ^ y);
}
instructions[vm.SHIFT] = function() {
  var x = data.pop();
  var y = data.pop();
  if (x < 0)
    data.push(y << (x * -1));
  else
    data.push(y >>= x);
}
instructions[vm.ZERO_EXIT] = function() {
  if (data.tos() == 0) {
    data.drop();
    ip = address.pop();
  }
}
instructions[vm.HALT] = function() {
  ip = IMAGE_SIZE;
}
instructions[vm.IE] = function() {
  data.push(2);
}
instructions[vm.IQ] = function() {
  var chosen = data.pop();
  if (chosen == 0) {
    data.push(0);
    data.push(0);
  } else if (chosen == 1) {
    data.push(20);
    data.push(0);
  }
}
instructions[vm.II] = function() {
  var chosen = data.pop();
  if (chosen == 0) {
    var s = String.fromCharCode(data.pop());
    document.getElementById('console').value += s;
  } else if (chosen == 1) {
    draw(data.pop())
  }
}

window.addEventListener('load', function(e) {
  rxPrepareVM();
}, false);

function processOpcode(opcode) {
  if (opcode != 0) {
    instructions[opcode]();
    checkStack();
  }
}

function validatePackedOpcodes(opcode) {
  var raw = opcode;
  var current;
  var valid = -1;
  var i = 0;
  while (i < 4) {
    current = raw & 0xFF;
    if (!current >= 0 && current <= 29)
      valid = 0;
    raw = raw >> 8;
    i++;
  }
}

function ngaProcessPackedOpcodes(opcode) {
  var raw = opcode;
  ops = new Array(3);
  ops[0] = raw & (255);
  raw = raw >> 8;
  ops[1] = raw & (255);
  raw = raw >> 8;
  ops[2] = raw & (255);
  raw = raw >> 8;
  ops[3] = raw & (255);
  processOpcode(ops[0]);
  processOpcode(ops[1]);
  processOpcode(ops[2]);
  processOpcode(ops[3]);
}


function loadInitialImage() {
  image = ngaImage.slice();
}

function execute(offset) {
  var opcode;
  address.sp = 1;
  ip = offset;
  while (ip < IMAGE_SIZE) {
    opcode = image[ip];
    if (ip == notfound) {
      document.getElementById('console').value +=
        "err:notfound : " + string_extract(image[7]) + "\n";
    }
    if (validatePackedOpcodes(opcode) != 0) {
      ngaProcessPackedOpcodes(opcode);
    } else {
      alert("Invalid instruction!");
      alert("At " + ip + ", opcode " + opcode);
    }
    if (address.sp == 0)
      ip = IMAGE_SIZE;
    ip++;
  }
}

function checkStack() {
  var depth = data.depth();
  var adepth = address.depth();
  var flag = 0;
  if (depth < 0 || adepth < 0) {
    flag = -1;
  }
  if (depth > DATA_DEPTH || adepth > DATA_DEPTH) {
    flag = -1;
  }
  if (flag == -1) {
    ip = 0;
    data.sp = 0;
    address.sp = 0;
  }
}

function string_inject(str, buffer) {
  var m = str.length;
  var i = 0;
  while (m > 0) {
    image[buffer + i] = str[i].charCodeAt(0);
    image[buffer + i + 1] = 0;
    m--;
    i++;
  }
}

function string_extract(at) {
  string_data = "";
  var starting = at;
  var i = 0;
  while (image[starting] != 0)
    string_data += String.fromCharCode(image[starting++]);
  return string_data;
}

function d_xt(dt) {
  return dt + 1;
}

function d_name(dt) {
  return dt + 4;
}

function d_lookup(name) {
  var dt = 0;
  var i = image[2];
  var dname;
  while (image[i] != 0 && i != 0) {
    dname = string_extract(d_name(i));
    if (dname == name) {
      dt = i;
      i = 0;
    } else {
      i = image[i];
    }
  }
  return dt;
}

function d_xt_for(name) {
  return image[d_xt(d_lookup(name))];
}

function evaluate(s) {
  if (s.length == 0)
    return;
  string_inject(s, image[7]);
  data.push(image[7]);
  execute(interpret);
}

function cls() {
  document.getElementById('console').value = "";
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function unu(src) {
  raw = src.split("\n");
  var i = raw.length;
  var lines = new Array();
  var j = 0;
  var code = 0;
  while (j < i) {
    if (code == 1 && raw[j] == "~~~") {
      code = 0;
    } else if (code == 0 && raw[j] == "~~~") {
      code = 1;
    } else if (code == 1) {
      lines.push(raw[j]);
    }
    j++;
  }
  return lines.join(" ");
}

function go() {
  rxPrepareVM();
  loadInitialImage();
  notfound = d_xt_for("err:notfound");
  interpret = d_xt_for("interpret");
  document.getElementById("console").value = "";
  src = document.getElementById("input").value;
  tokens = unu(src).match(/\S+/g);
  var i = tokens.length;
  var j = 0;
  while (j < i) {
    evaluate(tokens[j]);
    j++;
  }
  s = "";
  i = data.depth();
  j = 1;
  while (j <= i) {
    s = s + data.data[j] + " ";
    j++;
  }
  document.getElementById("console").value += "\n" + s;
  if (framebuffer === 0) {
    var canvas = document.getElementById('canvas');
    canvas.style.display = "none";
  } else {
    var canvas = document.getElementById('canvas');
    canvas.style.display = "block";
  }
}

function saveproject() {
  src = document.getElementById("input").value;
  localStorage.setItem("Snapshot", src);
}

function loadproject() {
  src = localStorage.getItem("Snapshot");
  document.getElementById("input").value = src;
}

function draw(fb_start) {
  framebuffer = 1;
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var imgData = ctx.createImageData(300, 300);
  var i;
  for (i = 0; i < imgData.data.length / 4; i += 1) {
    imgData.data[i * 4 + 0] = ((image[i + fb_start] >> 8) >> 8) & 255;
    imgData.data[i * 4 + 1] = (image[i + fb_start] >> 8) & 255;
    imgData.data[i * 4 + 2] = image[i + fb_start] & 255;
    imgData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
}
