
function Game () {
  this.scene = new THREE.Scene();

  this.camera = new THREE.OrthographicCamera(window.innerWidth / -80,
    window.innerWidth / 80,
    window.innerHeight / 80,
    window.innerHeight / -80,
    0.1, 5000);
  this.camera.position.set(100, 100, 100);
  this.cameraPos = {
    current: new THREE.Vector3(0, 0, 0), // 摄像机当前的坐标
    next: new THREE.Vector3() // 摄像机即将要移到的位置
  };

  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  this.renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild( this.renderer.domElement );
  this.canvas = this.renderer.domElement;

  // 灯光
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.1);
  directionalLight.position.set( 3, 10, 15);
  this.scene.add( directionalLight );
  var ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
  this.scene.add( ambientLight );

   this.config = {
      // 弹跳体参数设置
      jumpTopRadius: 0.3,
      jumpBottomRadius: 0.5,
      jumpHeight: 2,
      jumpColor: 0xffff00,
      // 立方体参数设置
      cubeX: 4,
      cubeY: 2,
      cubeZ: 4,
      cubeColor: 0x00ff00,
      // 圆柱体参数设置
      cylinderRadius: 2,
      cylinderHeight: 2,
      cylinderColor: 0x00ff00,
      // 设置缓存数组最大缓存多少个图形
      cubeMaxLen: 6,
      // 立方体内边缘之间的最小距离和最大距离
      cubeMinDis: 2.5,
      cubeMaxDis: 4
   };

   this.cubes = [];
   this.jumper = null;

   // mousedown : -1
   // mouseup : 1
   this.mouseState = 0;
   this.xspeed = 0;
   this.yspeed = 0;
   this.score = 0;

   this._initScore();

   this.failCallback = function(){};

}

Game.prototype.constructor = Game;

Object.assign(Game.prototype, {

  // 随机产生一个图形
  createCube: function (){
    var relativePos = Math.random() > 0.5 ? 'zDir' : 'xDir';
    // var relativePos = 'xDir';
    var cubeType = Math.random() > 0.5 ? 'cube' : 'cylinder';

    var geometry = cubeType === 'cube' ?
    new THREE.CubeGeometry(this.config.cubeX, this.config.cubeY, this.config.cubeZ):
    new THREE.CylinderGeometry(this.config.cylinderRadius, this.config.cylinderRadius, this.config.cylinderHeight, 100);
    var color = cubeType === 'cube' ? this.config.cubeColor : this.config.cylinderColor;
    var material = new THREE.MeshLambertMaterial( { color: color } );
    var mesh = new THREE.Mesh(geometry, material);

    // 产生随机图形
    if (this.cubes.length){
      var dis = this.getRandomValue(this.config.cubeMinDis, this.config.cubeMaxDis);
      var lastcube = this.cubes[this.cubes.length - 1];
      if (relativePos === 'zDir'){
        if (cubeType === 'cube'){
          if (lastcube.geometry instanceof THREE.CubeGeometry)
            // 方体 -> 方体
            mesh.position.set(lastcube.position.x, lastcube.position.y, lastcube.position.z - dis - this.config.cubeZ );
          else  // 方体 -> 圆柱体
            mesh.position.set(lastcube.position.x, lastcube.position.y, lastcube.position.z - dis - this.config.cylinderRadius - this.config.cubeZ / 2);
        } else {
          if (lastcube.geometry instanceof THREE.CubeGeometry)
             // 圆柱体 -> 方体
             mesh.position.set(lastcube.position.x, lastcube.position.y, lastcube.position.z - dis - this.config.cylinderRadius - this.config.cubeZ / 2);
          else
            // 圆柱体 -> 圆柱体
             mesh.position.set(lastcube.position.x, lastcube.position.y, lastcube.position.z -  dis - this.config.cylinderRadius * 2 );
        }
      } else {
        if (cubeType === 'cube'){
          if (lastcube.geometry instanceof THREE.CubeGeometry)
            // 方体 -> 方体
            mesh.position.set(lastcube.position.x + dis + this.config.cubeX, lastcube.position.y, lastcube.position.z);
          else  // 方体 -> 圆柱体
            mesh.position.set(lastcube.position.x + dis + this.config.cubeX / 2 + this.config.cylinderRadius, lastcube.position.y, lastcube.position.z);
        } else {
          if (lastcube.geometry instanceof THREE.CubeGeometry)
             // 圆柱体 -> 方体
             mesh.position.set(lastcube.position.x + dis + this.config.cylinderRadius + this.config.cubeX / 2 , lastcube.position.y, lastcube.position.z);
          else
            // 圆柱体 -> 圆柱体
             mesh.position.set(lastcube.position.x + dis + this.config.cylinderRadius * 2, lastcube.position.y, lastcube.position.z);
        }
      }
    } else {
      mesh.position.set(0, 0, 0);
    }

    this.testPosition(mesh.position);
    this.cubes.push(mesh);
    this.scene.add(mesh);
    this._render();
    // 如果缓存图形数大于最大缓存数，去掉一个
    if (this.cubes.length > this.config.cubeMaxLen){
      this.scene.remove(this.cubes.shift());
    }
    if (this.cubes.length > 1){
      // 更新相机位置
      this._updateCameraPos();
    } else {
      this.camera.lookAt(this.cameraPos.current);
    }
  },

  // 创建一个弹跳体
  createJumper: function (){
    var geometry = new THREE.CylinderGeometry(this.config.jumpTopRadius, this.config.jumpBottomRadius, this.config.jumpHeight, 100);
    var material = new THREE.MeshLambertMaterial( { color: this.config.jumpColor } );
    var mesh = new THREE.Mesh(geometry, material);
    geometry.translate(0, this.config.jumpHeight / 2, 0);
    mesh.position.set(0, this.config.jumpHeight / 2, 0);
    this.jumper = mesh;
    this.scene.add( mesh );
    this._render();
  },

  _render: function (){
    this.renderer.render(this.scene, this.camera);
  },

  _updateCameraPos: function (){
    var a = this.cubes[this.cubes.length - 2];
    var b = this.cubes[this.cubes.length - 1];
    var toPos = {
      x: ( a.position.x + b.position.x ) / 2,
      y: 0,
      z: ( a.position.z + b.position.z ) / 2
    };
    this.cameraPos.next = new THREE.Vector3(toPos.x, toPos.y, toPos.z);
    this._updateCamera();
  },

  _updateCamera: function (){
    var self = this;
    var c = {
      x: self.cameraPos.current.x,
      y: self.cameraPos.current.y,
      z: self.cameraPos.current.z
    };
    var n = {
      x: self.cameraPos.next.x,
      y: self.cameraPos.next.y,
      z: self.cameraPos.next.z
    };
    if (c.x > n.x  || c.z > n.z) {
      self.cameraPos.current.x -= 0.1;
      self.cameraPos.current.z -= 0.1;
      if (self.cameraPos.current.x - self.cameraPos.next.x < 0.05) {
        self.cameraPos.current.x = self.cameraPos.next.x;
      }
      if (self.cameraPos.current.z - self.cameraPos.next.z < 0.05) {
        self.cameraPos.current.z = self.cameraPos.next.z;
      }
      self.camera.lookAt(new THREE.Vector3(c.x, 0, c.z));
      self._render();
      requestAnimationFrame(function(){
        self._updateCamera();
      });
    }
  },

  _registerEvent: function (){
    this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    window.addEventListener('resize', this._onwindowResize.bind(this), false);
  },

  _destoryEvent: function (){
    this.canvas.removeEventListener('mousedown', this._onMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this._onMouseUp.bind(this));
    window.removeEventListener('resize', this._onwindowResize.bind(this), false);

  },

  _onwindowResize: function (){
    this.camera.left = window.innerWidth / -80;
    this.camera.right = window.innerWidth / 80;
    this.camera.top = window.innerHeight / 80;
    this.camera.bottom = window.innerHeight / -80;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  _onMouseDown: function (){
    this.mouseState = -1;
    if (this.jumper.scale.y > 0.02){ // 控制一个域值，防止缩放时底面也进行缩放
      this.jumper.scale.y -= 0.01;
      this.xspeed += 0.004; // 水平方向运动加速度
      this.yspeed += 0.008; // 垂直方向运动加速度
      this._render();
      requestAnimationFrame(function (){
        if (this.mouseState === -1) this._onMouseDown();
      }.bind(this));
    }
  },

  _onMouseUp: function (){
    var self  = this;
    this.mouseState  = 1;
    if (this.jumper.position.y >= this.config.jumpHeight / 2){
      // jumper还在空中运动
      var dir = this.getDirection();
      if (dir === 'x'){
        this.jumper.position.x += this.xspeed;
        this.jumper.position.y += this.yspeed;
      } else {
        this.jumper.position.z -= this.xspeed;
        this.jumper.position.y += this.yspeed;
      }
      this._render();
      // 垂直方向先上升后下降
      this.yspeed -= 0.01;
      // jumper要恢复
      if (this.jumper.scale.y < 1){
        this.jumper.scale.y += 0.02;
      }
      requestAnimationFrame(function (){
        this._onMouseUp();
      }.bind(this));
    } else {
      // jumper降落了
      var type = this.getJumpState();
      console.log('jumpstate:' + type);

      if (type === 1){
        // 落在当前块上
        this.xspeed = 0;
        this.yspeed = 0;
        this.jumper.scale.y = 1;
        this.jumper.position.y = this.config.jumpHeight / 2;
      } else if(type === 2 || type === 3){
        // 成功降落
         this.score += 1;
         this.xspeed = 0;
         this.yspeed = 0;
         this.jumper.scale.y = 1;
         this.jumper.position.y = this.config.jumpHeight / 2;
         this._updateScore();
         this.createCube();
      } else if (type === -2){
        // 落到大地上动画
        (function continuefalling () {
          if (self.jumper.position.y >= -self.config.jumpHeight / 2){
            self.jumper.position.y -= 0.06;
            self._render();
            requestAnimationFrame(continuefalling);
          }
        })();
        if (this.failCallback) {
          setTimeout(function(){
            self.failCallback(self.score);
          }, 1000);
        }
      } else {
        // 落到边缘处
        this.failingAnimation(type);
        if (this.failCallback) {
          setTimeout(function(){
            self.failCallback(self.score);
          }, 1000);
        }
      }
    }
  },

  _initScore: function (){
    var el = document.createElement('div');
    el.id = "score";
    el.innerHTML = '0';
    document.body.appendChild(el);
  },

  _updateScore: function (){
    document.getElementById('score').innerHTML = this.score;
  },

  start: function() {
    this.createCube();
    this.createCube();
    this.createJumper();
    this._registerEvent();
    this._updateScore();
  },

  restart: function (){
    for (var i = 0, len = this.cubes.length; i < len; i++){
      this.scene.remove(this.cubes[i]);
    }
    this.scene.remove(this.jumper);

    this.cameraPos = {
      current: new THREE.Vector3(0, 0, 0), // 摄像机当前的坐标
      next: new THREE.Vector3() // 摄像机即将要移到的位置
    };
    this.cubes = [];
    this.jumper = null;
    this.mouseState = 0;
    this.xspeed = 0;
    this.yspeed = 0;
    this.score = 0;

    this.createCube();
    this.createCube();
    this.createJumper();
    this._updateScore();
  },

  stop: function() {

  },

  getRandomValue: function (min, max){
    // min <= value < max
    return Math.floor(Math.random() * (max - min)) + min;
  },

  failingAnimation: function (state){
     var rotateAxis = this.getDirection() === 'z' ? 'x' : 'z';
     var rotateAdd, rotateTo;
     if (state === -1){
       rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
       rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
     } else {
       rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
       rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
     }
     if (rotateTo){
       this.jumper.rotation[rotateAxis] = rotateAdd;
       this._render();
       requestAnimationFrame(function (){
         this.failingAnimation(state);
       }.bind(this));
     } else {
       var self  = this;
       (function continuefalling () {
         if (self.jumper.position.y >= -self.config.jumpHeight / 2){
           self.jumper.position.y -= 0.06;
           self._render();
           requestAnimationFrame(continuefalling);
         }
       })();
     }
  },

  /*
  * 根据落点判断是否成功或失败，共分为以下几种情况
  * 返回值 1： 成功，但落点仍然在当前块上
  * 返回值 2： 成功，落点在下一个块上
  * 返回值 3： 成功，落点在中心点 （先不考虑，后续优化）
  * 返回值 -1：失败，落点在当前块边缘 或 在下一个块外边缘
  * 返回值 -2：失败，落点在当前块与下一块之间 或 在下一个块之外
  * 返回值 -3：失败，落点在下一个块内边缘
   */
  getJumpState: function (){
      var jumpR = this.config.jumpBottomRadius;
      var vard = this.getd();
      var d = vard.d;
      var d1 = vard.d1;
      var d2 = vard.d2;
      var d3 = vard.d3;
      var d4 = vard.d4;
      if (d <= d1) {
        return 1;
      }  else if (d > d1 && Math.abs(d - d1) <= jumpR) {
        return -1;
      } else if (Math.abs(d - d1) > jumpR && d < d2 && Math.abs(d - d2) >= jumpR){
        return -2;
      } else if ( d < d2 && Math.abs(d - d2) < jumpR){
        return -3;
      } else if ( d > d2 && d <= d4){
        return 2;
      } else if ( d > d4 && Math.abs(d - d4) < jumpR){
        return -1;
      } else {
        return -2;
      }
  },

  getd: function (){
    var d, d1, d2, d3, d4;
    var fromObj = this.cubes[this.cubes.length - 2];
    var fromPosition = fromObj.position;
    var fromType = fromObj.geometry instanceof THREE.CubeGeometry ? 'cube' : 'cylinder';
    var toObj = this.cubes[this.cubes.length - 1];
    var toPosition = toObj.position;
    var toType = toObj.geometry instanceof THREE.CubeGeometry ? 'cube' : 'cylinder';
    var jumpObj = this.jumper;
    var position = jumpObj.position;

    if (fromType === 'cube'){
       if (toType === 'cube'){
           if ( fromPosition.x === toPosition.x ){
             // -z 方向
             d = Math.abs(position.z);
             d1 = Math.abs(fromPosition.z - this.config.cubeZ / 2);
             d2 = Math.abs(toPosition.z + this.config.cubeZ / 2);
             d3 = Math.abs(toPosition.z);
             d4 = Math.abs(toPosition.z - this.config.cubeZ / 2);
           } else {
             // x 方向
             d = Math.abs(position.x);
             d1 = Math.abs(fromPosition.x + this.config.cubeX / 2);
             d2 = Math.abs(toPosition.x - this.config.cubeX / 2);
             d3 = Math.abs(toPosition.x);
             d4 = Math.abs(toPosition.x + this.config.cubeX / 2);
           }
       } else {
         if ( fromPosition.x === toPosition.x ){
           // -z 方向
           d = Math.abs(position.z);
           d1 = Math.abs(fromPosition.z - this.config.cubeZ / 2);
           d2 = Math.abs(toPosition.z + this.config.cylinderRadius);
           d3 = Math.abs(toPosition.z);
           d4 = Math.abs(toPosition.z - this.config.cylinderRadius);
         } else {
           // x 方向
           d = Math.abs(position.x);
           d1 = Math.abs(fromPosition.x + this.config.cubeX / 2);
           d2 = Math.abs(toPosition.x - this.config.cylinderRadius);
           d3 = Math.abs(toPosition.x);
           d4 = Math.abs(toPosition.x + this.config.cylinderRadius);
         }
       }
    } else {
      if (toType === 'cube'){
        if ( fromPosition.x === toPosition.x ){
          // -z 方向
          d = Math.abs(position.z);
          d1 = Math.abs(fromPosition.z - this.config.cylinderRadius);
          d2 = Math.abs(toPosition.z + this.config.cubeZ / 2);
          d3 = Math.abs(toPosition.z);
          d4 = Math.abs(toPosition.z - this.config.cubeZ / 2);
        } else {
          // x 方向
          d = Math.abs(position.x);
          d1 = Math.abs(fromPosition.x + this.config.cylinderRadius);
          d2 = Math.abs(toPosition.x - this.config.cubeX / 2);
          d3 = Math.abs(toPosition.x);
          d4 = Math.abs(toPosition.x + this.config.cubeX / 2);
        }
      } else {
        if ( fromPosition.x === toPosition.x ){
          // -z 方向
          d = Math.abs(position.z);
          d1 = Math.abs(fromPosition.z - this.config.cylinderRadius);
          d2 = Math.abs(toPosition.z + this.config.cylinderRadius);
          d3 = Math.abs(toPosition.z);
          d4 = Math.abs(toPosition.z - this.config.cylinderRadius);
        } else {
          // x 方向
          d = Math.abs(position.x);
          d1 = Math.abs(fromPosition.x + this.config.cylinderRadius);
          d2 = Math.abs(toPosition.x - this.config.cylinderRadius);
          d3 = Math.abs(toPosition.x);
          d4 = Math.abs(toPosition.x + this.config.cylinderRadius);
        }
      }
    }

    return {d: d, d1: d1, d2: d2, d3: d3, d4: d4};
  },

  getDirection: function (){
    var direction;
    if (this.cubes.length > 1){
      var from = this.cubes[this.cubes.length - 2];
      var to = this.cubes[this.cubes.length - 1];
      if (from.position.z === to.position.z) direction = 'x';
      if (from.position.x === to.position.x) direction = 'z';
    }
    return direction;
  },

  testPosition: function (position){
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)){
      console.log('position incorrect！');
    }
  }
});
