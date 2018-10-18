(function () {
	'use strict';

	const animationEngine = ( () => {

	  let uniqueID = 0;

	  class AnimationEngine {

	    constructor() {

	      this.ids = [];
	      this.animations = {};
	      this.update = this.update.bind( this );
	      this.raf = 0;
	      this.time = 0;

	    }

	    update() {

	      const now = performance.now();
	      const delta = now - this.time;
	      this.time = now;

	      let i = this.ids.length;

	      this.raf = i ? requestAnimationFrame( this.update ) : 0;

	      while ( i-- )
	        this.animations[ this.ids[ i ] ] && this.animations[ this.ids[ i ] ].update( delta );

	    }

	    add( animation ) {

	      animation.id = uniqueID ++;

	      this.ids.push( animation.id );
	      this.animations[ animation.id ] = animation;

	      if ( this.raf !== 0 ) return;

	      this.time = performance.now();
	      this.raf = requestAnimationFrame( this.update );

	    }

	    remove( animation ) {

	      const index = this.ids.indexOf( animation.id );

	      if ( index < 0 ) return;

	      this.ids.splice( index, 1 );
	      delete this.animations[ animation.id ];
	      animation = null;

	    }

	  }

	  return new AnimationEngine();

	} )();

	class Animation {

	  constructor( start ) {

	    if ( start === true ) this.start();

	  }

	  start() {

	    animationEngine.add( this );

	  }

	  stop() {

	    animationEngine.remove( this );

	  }

	  update( delta ) {}

	}

	class World extends Animation {

		constructor( game ) {

			super( true );

			this.game = game;

			this.container = this.game.dom.game;
			this.scene = new THREE.Scene();

			this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.container.appendChild( this.renderer.domElement );

			this.camera = new THREE.PerspectiveCamera( 2, 1, 0.1, 10000 );

			this.stage = { width: 2, height: 3 };
			this.fov = 10;

			this.createLights();

			this.resize();
			window.addEventListener( 'resize', () => this.resize(), false );

		}

		update() {

			this.renderer.render( this.scene, this.camera );

		}

		resize() {

			this.width = this.container.offsetWidth;
			this.height = this.container.offsetHeight;

			this.renderer.setSize( this.width, this.height );

		  this.camera.fov = this.fov;
		  this.camera.aspect = this.width / this.height;

			const aspect = this.stage.width / this.stage.height;
		  const fovRad = this.fov * THREE.Math.DEG2RAD;

		  let distance = ( aspect < this.camera.aspect )
				? ( this.stage.height / 2 ) / Math.tan( fovRad / 2 )
				: ( this.stage.width / this.camera.aspect ) / ( 2 * Math.tan( fovRad / 2 ) );

		  distance *= 0.5;

			this.camera.position.set( distance, distance, distance);
			this.camera.lookAt( this.scene.position );
			this.camera.updateProjectionMatrix();

			const docFontSize = ( aspect < this.camera.aspect )
				? ( this.height / 100 ) * aspect
				: this.width / 100;

			document.documentElement.style.fontSize = docFontSize + 'px';

		}

		createLights() {

			this.lights = {
				holder:  new THREE.Object3D,
				ambient: new THREE.AmbientLight( 0xffffff, 0.69 ),
				front:   new THREE.DirectionalLight( 0xffffff, 0.36 ),
				back:    new THREE.DirectionalLight( 0xffffff, 0.19 ),
			};

			this.lights.front.position.set( 1.5, 5, 3 );
			this.lights.back.position.set( -1.5, -5, -3 );

			this.lights.holder.add( this.lights.ambient );
			this.lights.holder.add( this.lights.front );
			this.lights.holder.add( this.lights.back );

			this.scene.add( this.lights.holder );

		}

		enableShadows() {

			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

			this.lights.front.castShadow = true;

	    this.lights.front.shadow.mapSize.width = 512;
	    this.lights.front.shadow.mapSize.height = 512;

	    var d = 1.5;

	    this.lights.front.shadow.camera.left = -d;
	    this.lights.front.shadow.camera.right = d;
	    this.lights.front.shadow.camera.top = d;
	    this.lights.front.shadow.camera.bottom = -d;

	    this.lights.front.shadow.camera.near = 1;
	    this.lights.front.shadow.camera.far = 9;

			// const helper = new THREE.CameraHelper( this.lights.front.shadow.camera );
			// this.scene.add( helper );

			this.game.cube.holder.traverse( node => {

				if ( node instanceof THREE.Mesh ) {

					node.castShadow = true;
					node.receiveShadow = true;

				}

			} );

			// this.ground = new THREE.Mesh(
			// 	new THREE.PlaneBufferGeometry( 20, 20 ),
			// 	new THREE.MeshStandardMaterial( { color: 0x00aaff } )
			// );

			// this.ground.receiveShadow = true;
			// this.ground.rotation.x = - Math.PI / 2;
			// this.ground.position.y = - 1.5;

			// this.scene.add( this.ground );

		}

	}

	function RoundedBoxGeometry( width, height, depth, radius, radiusSegments ) {

	  THREE.BufferGeometry.call( this );

	  this.type = 'RoundedBoxGeometry';

	  radiusSegments = ! isNaN( radiusSegments ) ? Math.max( 1, Math.floor( radiusSegments ) ) : 1;

	  width = ! isNaN( width ) ? width : 1;
	  height = ! isNaN( height ) ? height : 1;
	  depth = ! isNaN( depth ) ? depth : 1;

	  radius = ! isNaN( radius ) ? radius : .15;
	  radius = Math.min( radius, Math.min( width, Math.min( height, Math.min( depth ) ) ) / 2 );

	  var edgeHalfWidth = width / 2 - radius;
	  var edgeHalfHeight = height / 2 - radius;
	  var edgeHalfDepth = depth / 2 - radius;

	  this.parameters = {
	    width: width,
	    height: height,
	    depth: depth,
	    radius: radius,
	    radiusSegments: radiusSegments
	  };

	  var rs1 = radiusSegments + 1; //radius segments + 1
	  var totalVertexCount = ( rs1 * radiusSegments + 1 ) << 3;

	  var positions = new THREE.BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );
	  var normals = new THREE.BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );

	  var
	    cornerVerts = [],
	    cornerNormals = [],
	    normal = new THREE.Vector3(),
	    vertex = new THREE.Vector3(),
	    vertexPool = [],
	    normalPool = [],
	    indices = []
	  ;

	  var
	    lastVertex = rs1 * radiusSegments,
	    cornerVertNumber = rs1 * radiusSegments + 1
	  ;

	  doVertices();
	  doFaces();
	  doCorners();
	  doHeightEdges();
	  doWidthEdges();
	  doDepthEdges();

	  function doVertices() {

	    var cornerLayout = [
	      new THREE.Vector3( 1, 1, 1 ),
	      new THREE.Vector3( 1, 1, - 1 ),
	      new THREE.Vector3( - 1, 1, - 1 ),
	      new THREE.Vector3( - 1, 1, 1 ),
	      new THREE.Vector3( 1, - 1, 1 ),
	      new THREE.Vector3( 1, - 1, - 1 ),
	      new THREE.Vector3( - 1, - 1, - 1 ),
	      new THREE.Vector3( - 1, - 1, 1 )
	    ];

	    for ( var j = 0; j < 8; j ++ ) {

	      cornerVerts.push( [] );
	      cornerNormals.push( [] );

	    }

	    var PIhalf = Math.PI / 2;
	    var cornerOffset = new THREE.Vector3( edgeHalfWidth, edgeHalfHeight, edgeHalfDepth );

	    for ( var y = 0; y <= radiusSegments; y ++ ) {

	      var v = y / radiusSegments;
	      var va = v * PIhalf; //arrange in 90 deg
	      var cosVa = Math.cos( va ); //scale of vertical angle
	      var sinVa = Math.sin( va );

	      if ( y == radiusSegments ) {

	        vertex.set( 0, 1, 0 );
	        var vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
	        cornerVerts[ 0 ].push( vert );
	        vertexPool.push( vert );
	        var norm = vertex.clone();
	        cornerNormals[ 0 ].push( norm );
	        normalPool.push( norm );
	        continue; //skip row loop

	      }

	      for ( var x = 0; x <= radiusSegments; x ++ ) {

	        var u = x / radiusSegments;
	        var ha = u * PIhalf;
	        vertex.x = cosVa * Math.cos( ha );
	        vertex.y = sinVa;
	        vertex.z = cosVa * Math.sin( ha );

	        var vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
	        cornerVerts[ 0 ].push( vert );
	        vertexPool.push( vert );

	        var norm = vertex.clone().normalize();
	        cornerNormals[ 0 ].push( norm );
	        normalPool.push( norm );

	      }

	    }

	    for ( var i = 1; i < 8; i ++ ) {

	      for ( var j = 0; j < cornerVerts[ 0 ].length; j ++ ) {

	        var vert = cornerVerts[ 0 ][ j ].clone().multiply( cornerLayout[ i ] );
	        cornerVerts[ i ].push( vert );
	        vertexPool.push( vert );

	        var norm = cornerNormals[ 0 ][ j ].clone().multiply( cornerLayout[ i ] );
	        cornerNormals[ i ].push( norm );
	        normalPool.push( norm );

	      }

	    }

	  }


	  // weave corners ====================================

	  function doCorners() {

	    var flips = [
	      true,
	      false,
	      true,
	      false,
	      false,
	      true,
	      false,
	      true
	    ];

	    var lastRowOffset = rs1 * ( radiusSegments - 1 );

	    for ( var i = 0; i < 8; i ++ ) {

	      var cornerOffset = cornerVertNumber * i;

	      for ( var v = 0; v < radiusSegments - 1; v ++ ) {

	        var r1 = v * rs1; //row offset
	        var r2 = ( v + 1 ) * rs1; //next row

	        for ( var u = 0; u < radiusSegments; u ++ ) {

	          var u1 = u + 1;
	          var a = cornerOffset + r1 + u;
	          var b = cornerOffset + r1 + u1;
	          var c = cornerOffset + r2 + u;
	          var d = cornerOffset + r2 + u1;

	          if ( ! flips[ i ] ) {

	            indices.push( a );
	            indices.push( b );
	            indices.push( c );

	            indices.push( b );
	            indices.push( d );
	            indices.push( c );

	          } else {

	            indices.push( a );
	            indices.push( c );
	            indices.push( b );

	            indices.push( b );
	            indices.push( c );
	            indices.push( d );

	          }

	        }

	      }

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var a = cornerOffset + lastRowOffset + u;
	        var b = cornerOffset + lastRowOffset + u + 1;
	        var c = cornerOffset + lastVertex;

	        if ( ! flips[ i ] ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );

	        }

	      }

	    }

	  }

	  function doFaces() {

	    var a = lastVertex;// + cornerVertNumber * 0;
	    var b = lastVertex + cornerVertNumber;// * 1;
	    var c = lastVertex + cornerVertNumber * 2;
	    var d = lastVertex + cornerVertNumber * 3;

	    indices.push( a );
	    indices.push( b );
	    indices.push( c );
	    indices.push( a );
	    indices.push( c );
	    indices.push( d );

	    a = lastVertex + cornerVertNumber * 4;// + cornerVertNumber * 0;
	    b = lastVertex + cornerVertNumber * 5;// * 1;
	    c = lastVertex + cornerVertNumber * 6;
	    d = lastVertex + cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( a );
	    indices.push( d );
	    indices.push( c );

	    a = 0;
	    b = cornerVertNumber;
	    c = cornerVertNumber * 4;
	    d = cornerVertNumber * 5;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	    a = cornerVertNumber * 2;
	    b = cornerVertNumber * 3;
	    c = cornerVertNumber * 6;
	    d = cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	    a = radiusSegments;
	    b = radiusSegments + cornerVertNumber * 3;
	    c = radiusSegments + cornerVertNumber * 4;
	    d = radiusSegments + cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( b );
	    indices.push( c );
	    indices.push( b );
	    indices.push( d );
	    indices.push( c );

	    a = radiusSegments + cornerVertNumber;
	    b = radiusSegments + cornerVertNumber * 2;
	    c = radiusSegments + cornerVertNumber * 5;
	    d = radiusSegments + cornerVertNumber * 6;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	  }

	  function doHeightEdges() {

	    for ( var i = 0; i < 4; i ++ ) {

	      var cOffset = i * cornerVertNumber;
	      var cRowOffset = 4 * cornerVertNumber + cOffset;
	      var needsFlip = i & 1 === 1;

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var u1 = u + 1;
	        var a = cOffset + u;
	        var b = cOffset + u1;
	        var c = cRowOffset + u;
	        var d = cRowOffset + u1;

	        if ( ! needsFlip ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        }

	      }

	    }

	  }

	  function doDepthEdges() {

	    var cStarts = [ 0, 2, 4, 6 ];
	    var cEnds = [ 1, 3, 5, 7 ];

	    for ( var i = 0; i < 4; i ++ ) {

	      var cStart = cornerVertNumber * cStarts[ i ];
	      var cEnd = cornerVertNumber * cEnds[ i ];

	      var needsFlip = 1 >= i;

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var urs1 = u * rs1;
	        var u1rs1 = ( u + 1 ) * rs1;

	        var a = cStart + urs1;
	        var b = cStart + u1rs1;
	        var c = cEnd + urs1;
	        var d = cEnd + u1rs1;

	        if ( needsFlip ) {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        } else {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        }

	      }

	    }

	  }

	  function doWidthEdges() {

	    var end = radiusSegments - 1;

	    var cStarts = [ 0, 1, 4, 5 ];
	    var cEnds = [ 3, 2, 7, 6 ];
	    var needsFlip = [ 0, 1, 1, 0 ];

	    for ( var i = 0; i < 4; i ++ ) {

	      var cStart = cStarts[ i ] * cornerVertNumber;
	      var cEnd = cEnds[ i ] * cornerVertNumber;

	      for ( var u = 0; u <= end; u ++ ) {

	        var a = cStart + radiusSegments + u * rs1;
	        var b = cStart + ( u != end ? radiusSegments + ( u + 1 ) * rs1 : cornerVertNumber - 1 );

	        var c = cEnd + radiusSegments + u * rs1;
	        var d = cEnd + ( u != end ? radiusSegments + ( u + 1 ) * rs1 : cornerVertNumber - 1 );

	        if ( ! needsFlip[ i ] ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        }

	      }

	    }

	  }

	  var index = 0;

	  for ( var i = 0; i < vertexPool.length; i ++ ) {

	    positions.setXYZ(
	      index,
	      vertexPool[ i ].x,
	      vertexPool[ i ].y,
	      vertexPool[ i ].z
	    );

	    normals.setXYZ(
	      index,
	      normalPool[ i ].x,
	      normalPool[ i ].y,
	      normalPool[ i ].z
	    );

	    index ++;

	  }

	  this.setIndex( new THREE.BufferAttribute( new Uint16Array( indices ), 1 ) );
	  this.addAttribute( 'position', positions );
	  this.addAttribute( 'normal', normals );

	}

	RoundedBoxGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
	RoundedBoxGeometry.constructor = RoundedBoxGeometry;

	function CubePieces( size, positions, colors ) {

		const pieces = [];

		const edgeScale = 0.84;
		const edgeRoundness = 0.15;
		const pieceRoundness = 0.105;
		const edgeDepth = 0.014;
		const pieceSize = 1 / size;

		const pieceMesh = new THREE.Mesh(
			new RoundedBoxGeometry( pieceSize, pieceSize, pieceSize, pieceSize * pieceRoundness, 3 ),
			new THREE.MeshLambertMaterial( { color: colors.piece, side: THREE.FrontSide } )
		);

		const edgeGeometry = RoundedPlaneGeometry( - pieceSize / 2, - pieceSize / 2, pieceSize, pieceSize, pieceSize * edgeRoundness, edgeDepth );
		const edgeMaterial = new THREE.MeshLambertMaterial( { color: colors.piece, side: THREE.FrontSide } );

		positions.forEach( ( position, index ) => {

			const piece = new THREE.Object3D();
			const pieceCube = pieceMesh.clone();
			const edges = [];
			// let edgesNames = '';

			piece.position.copy( position.clone().divideScalar( size ) );
			piece.add( pieceCube );
			piece.name = index;
			piece.edgesName = '';

			position.edges.forEach( position => {

				const edge = createEdge( position );
				edge.userData.name = [ 'L', 'R', 'D', 'U', 'B', 'F' ][ position ];
				piece.add( edge );
				edges.push( edge.userData.name );

			} );

			piece.userData.edges = edges;
			piece.userData.cube = pieceCube;
			piece.userData.start = {
				position: piece.position.clone(),
				rotation: piece.rotation.clone(),
			};

			pieces.push( piece );

		} );

		return pieces;

		function createEdge( position ) {

			const distance = pieceSize / 2;
			const edge = new THREE.Mesh(
			  edgeGeometry,
			  edgeMaterial.clone()
			);

			edge.position.set(
			  distance * [ - 1, 1, 0, 0, 0, 0 ][ position ],
			  distance * [ 0, 0, - 1, 1, 0, 0 ][ position ],
			  distance * [ 0, 0, 0, 0, - 1, 1 ][ position ]
			);

			edge.rotation.set(
			  Math.PI / 2 * [ 0, 0, 1, - 1, 0, 0 ][ position ],
			  Math.PI / 2 * [ - 1, 1, 0, 0, 2, 0 ][ position ],
		  	0
			);

			edge.material.color.setHex( colors[ [ 'left', 'right', 'bottom', 'top', 'back', 'front' ][ position ] ] );
			edge.scale.set( edgeScale, edgeScale, edgeScale );

			return edge;

		}

		function RoundedPlaneGeometry( x, y, width, height, radius, depth ) {

			const shape = new THREE.Shape();

			shape.moveTo( x, y + radius );
			shape.lineTo( x, y + height - radius );
			shape.quadraticCurveTo( x, y + height, x + radius, y + height );
			shape.lineTo( x + width - radius, y + height );
			shape.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
			shape.lineTo( x + width, y + radius );
			shape.quadraticCurveTo( x + width, y, x + width - radius, y );
			shape.lineTo( x + radius, y );
			shape.quadraticCurveTo( x, y, x, y + radius );

			const geometry = new THREE.ExtrudeBufferGeometry( shape, { depth: depth, bevelEnabled: false, curveSegments: 3 } );

			return geometry;

		}

	}

	class Cube {

		constructor( game ) {

			this.game = game;

			this.size = 3;

			this.colors = {
				right: 0x41aac8,
				left: 0x82ca38,
				top: 0xfff7ff,
				bottom: 0xffef48,
				front: 0xef3923,
				back: 0xff8c0a,
				piece: 0x08101a,
			};

			this.holder = new THREE.Object3D();
			this.object = new THREE.Object3D();
			this.animator = new THREE.Object3D();

			this.holder.add( this.animator );
			this.animator.add( this.object );

			this.cubes = [];

			this.positions = this.generatePositions( this.size );
			this.pieces = CubePieces( this.size, this.positions, this.colors );

			this.pieces.forEach( piece => {

				this.cubes.push( piece.userData.cube );
				this.object.add( piece );

			} );

			this.game.world.scene.add( this.holder );

		}

		reset() {

			this.game.controls.edges.rotation.set( 0, 0, 0 );

			this.holder.rotation.set( 0, 0, 0 );
			this.object.rotation.set( 0, 0, 0 );
			this.animator.rotation.set( 0, 0, 0 );

			this.pieces.forEach( piece => {

				piece.position.copy( piece.userData.start.position );
				piece.rotation.copy( piece.userData.start.rotation );

			} );

		}

		generatePositions( size ) {

			let x, y, z;
			const start = -( size - 1 ) / 2;
			const positions = [];

			for ( x = 0; x < size; x ++ ) {

				for ( y = 0; y < size; y ++ ) {

			  	for ( z = 0; z < size; z ++ ) {

			  		let position = new THREE.Vector3( start + x, start + y, start + z );
			  		let edges = [];

			  		if ( x == 0 ) edges.push(0);
			  		if ( x == size - 1 ) edges.push(1);

			  		if ( y == 0 ) edges.push(2);
			  		if ( y == size - 1 ) edges.push(3);

			  		if ( z == 0 ) edges.push(4);
			  		if ( z == size - 1 ) edges.push(5);

			  		position.edges = edges;

			  		positions.push( position );

			  	}

			  }

			}

			return positions;

		}

	}

	const Easing = {

	  // Linear 1, Quad 2, Cubic 3, Quart 4, Quint 5

	  Power: {

	    In: power => {

	      power = Math.round( power || 1 );

	      return t => Math.pow( t, power );

	    },

	    Out: power => {

	      power = Math.round( power || 1 );

	      return t => 1 - Math.abs( Math.pow( t - 1, power ) );

	    },

	    InOut: power => {

	      power = Math.round( power || 1 );

	      return t => ( t < 0.5 )
	        ? Math.pow( t * 2, power ) / 2
	        : ( 1 - Math.abs( Math.pow( ( t * 2 - 1 ) - 1, power ) ) ) / 2 + 0.5;

	    },

	  },

	  Sine: {

	    In: () => t => 1 + Math.sin( Math.PI / 2 * t - Math.PI / 2 ),

	    Out: () => t => Math.sin( Math.PI / 2 * t ),

	    InOut: () => t => ( 1 + Math.sin( Math.PI * t - Math.PI / 2 ) ) / 2,

	  },

	  Back: {

	    Out: s => {

	      s = s || 1.70158;

	      return t => { return ( t -= 1 ) * t * ( ( s + 1 ) * t + s ) + 1; };

	    },

	    In: s => {

	      s = s || 1.70158;

	      return t => { return t * t * ( ( s + 1 ) * t - s ); };

	    }

	  },

	  Elastic: {

	    Out: ( amplitude, period ) => {

	      let PI2 = Math.PI * 2;

	      let p1 = ( amplitude >= 1 ) ? amplitude : 1;
	      let p2 = ( period || 0.3 ) / ( amplitude < 1 ? amplitude : 1 );
	      let p3 = p2 / PI2 * ( Math.asin( 1 / p1 ) || 0 );

	      p2 = PI2 / p2;

	      return t => { return p1 * Math.pow( 2, -10 * t ) * Math.sin( ( t - p3 ) * p2 ) + 1 }

	    },

	  },

	};

	class Tween extends Animation {

	  constructor( options ) {

	    super( false );

	    this.duration = options.duration || 500;
	    this.easing = options.easing || ( t => t );
	    this.onUpdate = options.onUpdate || ( () => {} );
	    this.onComplete = options.onComplete || ( () => {} );

	    this.delay = options.delay || false;
	    this.yoyo = options.yoyo ? false : null;

	    this.progress = 0;
	    this.value = 0;
	    this.delta = 0;

	    this.getFromTo( options );

	    if ( this.delay ) setTimeout( () => super.start(), this.delay );
	    else super.start();

	    this.onUpdate( this );

	  }

	  update( delta ) {

	    const old = this.value * 1;
	    const direction = ( this.yoyo === true ) ? - 1 : 1;

	    this.progress += ( delta / this.duration ) * direction;

	    this.value = this.easing( this.progress );
	    this.delta = this.value - old;

	    if ( this.values !== null ) this.updateFromTo();

	    if ( this.yoyo !== null ) this.updateYoyo();
	    else if ( this.progress <= 1 ) this.onUpdate( this );
	    else {

	      this.progress = 1;
	      this.value = 1;
	      this.onUpdate( this );
	      this.onComplete( this );
	      super.stop();      

	    }

	  }

	  updateYoyo() {

	    if ( this.progress > 1 || this.progress < 0 ) {

	      this.value = this.progress = ( this.progress > 1 ) ? 1 : 0;
	      this.yoyo = ! this.yoyo;

	    }

	    this.onUpdate( this );

	  }

	  updateFromTo() {

	    this.values.forEach( key => {

	      this.target[ key ] = this.from[ key ] + ( this.to[ key ] - this.from[ key ] ) * this.value;

	    } );

	  }

	  getFromTo( options ) {

	    if ( ! options.target || ! options.to ) {

	      this.values = null;
	      return;

	    }

	    this.target = options.target || null;
	    this.from = options.from || {};
	    this.to = options.to || null;
	    this.values = [];

	    if ( Object.keys( this.from ).length < 1 )
	      Object.keys( this.to ).forEach( key => { this.from[ key ] = this.target[ key ]; } );

	    Object.keys( this.to ).forEach( key => { this.values.push( key ); } );

	  }

	}

	window.addEventListener( 'touchmove', () => {} );
	document.addEventListener( 'touchmove',  event => { event.preventDefault(); }, { passive: false } );

	class Draggable {

	  constructor( element, options ) {

	    this.position = {
	      current: new THREE.Vector2(),
	      start: new THREE.Vector2(),
	      delta: new THREE.Vector2(),
	      old: new THREE.Vector2(),
	      drag: new THREE.Vector2(),
	      // momentum: new THREE.Vector2(),
	    };

	    this.options = Object.assign( {
	      calcDelta: false,
	      // calcMomentum: false,
	    }, options || {} );

	    // if ( this.options.calcMomentum ) this.options.calcDelta = true;

	    this.element = element;
	    this.touch = null;

	    this.drag = {

	      start: ( event ) => {

	        if ( event.type == 'mousedown' && event.which != 1 ) return;
	        if ( event.type == 'touchstart' && event.touches.length > 1 ) return;

	        this.getPositionCurrent( event );

	        if ( this.options.calcDelta ) {

	          this.position.start = this.position.current.clone();
	          this.position.delta.set( 0, 0 );
	          this.position.drag.set( 0, 0 );

	        }

	        // if ( this.options.calcMomentum ) {

	        //     this.position.momentum.set( 0, 0 );

	        // }

	        this.touch = ( event.type == 'touchstart' );

	        this.onDragStart( this.position );

	        window.addEventListener( ( this.touch ) ? 'touchmove' : 'mousemove', this.drag.move, false );
	        window.addEventListener( ( this.touch ) ? 'touchend' : 'mouseup', this.drag.end, false );

	      },

	      move: ( event ) => {

	        if ( this.options.calcDelta ) {

	          this.position.old = this.position.current.clone();

	        }

	        this.getPositionCurrent( event );

	        if ( this.options.calcDelta ) {

	          this.position.delta = this.position.current.clone().sub( this.position.old );
	          this.position.drag = this.position.current.clone().sub( this.position.start );

	        }

	        // if ( this.options.calcMomentum ) {

	        //   this.addMomentumPoint( this.position.delta );

	        // }

	        this.onDragMove( this.position );

	      },

	      end: ( event ) => {

	        this.getPositionCurrent( event );

	        // if ( this.options.calcMomentum ) this.getMomentum();

	        this.onDragEnd( this.position );

	        window.removeEventListener( ( this.touch ) ? 'touchmove' : 'mousemove', this.drag.move, false );
	        window.removeEventListener( ( this.touch ) ? 'touchend' : 'mouseup', this.drag.end, false );

	      },

	    };

	    this.onDragStart = () => {};
	    this.onDragMove = () => {};
	    this.onDragEnd = () => {};

	    this.enable();

	    return this;

	  }

	  enable() {

	    this.element.addEventListener( 'touchstart', this.drag.start, false );
	    this.element.addEventListener( 'mousedown', this.drag.start, false );

	    return this;

	  }

	  disable() {

	    this.element.removeEventListener( 'touchstart', this.drag.start, false );
	    this.element.removeEventListener( 'mousedown', this.drag.start, false );

	    return this;

	  }

	  getPositionCurrent( event ) {

	    const dragEvent = event.touches
	      ? ( event.touches[ 0 ] || event.changedTouches[ 0 ] )
	      : event;

	    this.position.current.set( dragEvent.pageX, dragEvent.pageY );

	  }

	  convertPosition( position ) {

	    position.x = ( position.x / this.element.offsetWidth ) * 2 - 1;
	    position.y = - ( ( position.y / this.element.offsetHeight ) * 2 - 1 );

	    return position;

	  }

	  // addMomentumPoint( delta ) {

	  //   const time = Date.now();

	  //   while ( this.momentum.length > 0 ) {

	  //     if ( time - this.momentum[0].time <= 200 ) break;
	  //     this.momentum.shift();

	  //   }

	  //   if ( delta !== false ) this.momentum.push( { delta, time } );

	  // }

	  // getMomentum() {

	  //   const points = this.momentum.length;
	  //   const momentum = new THREE.Vector2();

	  //   this.addMomentumPoint( false );

	  //   this.momentum.forEach( ( point, index ) => {

	  //     momentum.add( point.delta.multiplyScalar( index / points ) )

	  //   } );

	  //   return momentum;

	  // }

	}

	const STILL = 0;
	const PREPARING = 1;
	const ROTATING = 2;
	const ANIMATING = 3;

	class Controls {

	  constructor( game ) {

	    this.game = game;

	    this.flipSpeed = 300;
	    this.flipBounce = 1.70158;
	    this.scrambleSpeed = 150;
	    this.scrambleBounce = 0;

	    this.raycaster = new THREE.Raycaster();

	    this.group = new THREE.Object3D();
	    this.game.cube.object.add( this.group );

	    this.helper = new THREE.Mesh(
	      new THREE.PlaneBufferGeometry( 20, 20 ),
	      new THREE.MeshBasicMaterial( { depthWrite: false, transparent: true, opacity: 0, color: 0x0033ff } )
	    );

	    this.helper.rotation.set( 0, Math.PI / 4, 0 );
	    this.game.world.scene.add( this.helper );

	    this.edges = new THREE.Mesh(
	      new THREE.BoxBufferGeometry( 0.95, 0.95, 0.95 ),
	      new THREE.MeshBasicMaterial( { depthWrite: false, transparent: true, opacity: 0, color: 0xff0033 } )
	    );

	    this.game.world.scene.add( this.edges );

	    this.onSolved = () => {};
	    this.onMove = () => {};

	    this.momentum = [];

	    this.scramble = null;
	    this.state = STILL;

	    this.initDraggable();

	  }

	  enable() {

	    this.draggable.enable();

	  }

	  disable() {

	    this.draggable.disable();

	  }

	  initDraggable() {

	    this.draggable = new Draggable( this.game.dom.game );

	    this.draggable.onDragStart = position => {

	      if ( this.scramble !== null ) return;
	      if ( this.state === PREPARING || this.state === ROTATING ) return;

	      this.gettingDrag = this.state === ANIMATING;

	      const edgeIntersect = this.getIntersect( position.current, this.edges, false );

	      if ( edgeIntersect !== false ) {

	        this.dragNormal = edgeIntersect.face.normal.round();
	        this.flipType = 'layer';

	        this.attach( this.helper, this.edges );

	        this.helper.rotation.set( 0, 0, 0 );
	        this.helper.position.set( 0, 0, 0 );
	        this.helper.lookAt( this.dragNormal );
	        this.helper.translateZ( 0.5 );
	        this.helper.updateMatrixWorld();

	        this.detach( this.helper, this.edges );

	      } else {

	        this.dragNormal = new THREE.Vector3( 0, 0, 1 );
	        this.flipType = 'cube';

	        this.helper.position.set( 0, 0, 0 );
	        this.helper.rotation.set( 0, Math.PI / 4, 0 );
	        this.helper.updateMatrixWorld();

	      }

	      const planeIntersect = this.getIntersect( position.current, this.helper, false ).point;
	      if ( planeIntersect === false ) return;

	      this.dragCurrent = this.helper.worldToLocal( planeIntersect );
	      this.dragTotal = new THREE.Vector3();
	      this.state = ( this.state === STILL ) ? PREPARING : this.state;

	    };

	    this.draggable.onDragMove = position => {

	      if ( this.scramble !== null ) return;
	      if ( this.state === STILL || ( this.state === ANIMATING && this.gettingDrag === false ) ) return;

	      const planeIntersect = this.getIntersect( position.current, this.helper, false );
	      if ( planeIntersect === false ) return;

	      const point = this.helper.worldToLocal( planeIntersect.point.clone() );

	      this.dragDelta = point.clone().sub( this.dragCurrent ).setZ( 0 );
	      this.dragTotal.add( this.dragDelta );
	      this.dragCurrent = point;
	      this.addMomentumPoint( this.dragDelta );

	      if ( this.state === PREPARING && this.dragTotal.length() > 0.05 ) {

	        this.dragDirection = this.getMainAxis( this.dragTotal );

	        if ( this.flipType === 'layer' ) {

	          const direction = new THREE.Vector3();
	          direction[ this.dragDirection ] = 1;

	          const worldDirection = this.helper.localToWorld( direction ).sub( this.helper.position );
	          const objectDirection = this.edges.worldToLocal( worldDirection ).round();

	          this.flipAxis = objectDirection.cross( this.dragNormal ).negate();

	          this.dragIntersect = this.getIntersect( position.current, this.game.cube.cubes, true );

	          this.selectLayer( this.getLayer( false ) );

	        } else {

	          const axis = ( this.dragDirection != 'x' )
	            ? ( ( this.dragDirection == 'y' && position.current.x > this.game.world.width / 2 ) ? 'z' : 'x' )
	            : 'y';

	          this.flipAxis = new THREE.Vector3();
	          this.flipAxis[ axis ] = 1 * ( ( axis == 'x' ) ? - 1 : 1 );

	        }

	        this.flipAngle = 0;
	        this.state = ROTATING;

	      } else if ( this.state === ROTATING ) {

	        const rotation = this.dragDelta[ this.dragDirection ];// * 2.25;

	        if ( this.flipType === 'layer' ) { 

	          this.group.rotateOnAxis( this.flipAxis, rotation );
	          this.flipAngle += rotation;

	        } else {

	          this.edges.rotateOnWorldAxis( this.flipAxis, rotation );
	          this.game.cube.object.rotation.copy( this.edges.rotation );
	          this.flipAngle += rotation;

	        }

	      }

	    };

	    this.draggable.onDragEnd = position => {

	      if ( this.scramble !== null ) return;
	      if ( this.state !== ROTATING ) {

	        this.gettingDrag = false;
	        this.state = STILL;
	        return;

	      }

	      this.state = ANIMATING;

	      const momentum = this.getMomentum()[ this.dragDirection ];
	      const flip = ( Math.abs( momentum ) > 0.05 && Math.abs( this.flipAngle ) < Math.PI / 2 );

	      const angle = flip
	        ? this.roundAngle( this.flipAngle + Math.sign( this.flipAngle ) * ( Math.PI / 4 ) )
	        : this.roundAngle( this.flipAngle );

	      const delta = angle - this.flipAngle;

	      if ( this.flipType === 'layer' ) {

	        this.rotateLayer( delta, false, layer => {

	          this.game.storage.saveGame();
	          
	          this.state = this.gettingDrag ? PREPARING : STILL;
	          this.gettingDrag = false;

	          this.checkIsSolved();

	        } );

	      } else {

	        this.rotateCube( delta, () => {

	          this.state = this.gettingDrag ? PREPARING : STILL;
	          this.gettingDrag = false;

	        } );

	      }

	    };

	  }

	  rotateLayer( rotation, scramble, callback ) {

	    const bounce = scramble ? this.scrambleBounce : this.flipBounce;
	    const bounceCube = ( bounce > 0 ) ? this.bounceCube() : ( () => {} );

	    this.rotationTween = new Tween( {
	      duration:scramble ? this.scrambleSpeed : this.flipSpeed,
	      easing: Easing.Back.Out( bounce ),
	      onUpdate: tween => {

	        let deltaAngle = tween.delta * rotation;
	        this.group.rotateOnAxis( this.flipAxis, deltaAngle );
	        bounceCube( tween.value, deltaAngle, rotation );

	      },
	      onComplete: () => {

	        const layer = this.flipLayer.slice( 0 );

	        this.game.cube.object.rotation.setFromVector3( this.snapRotation( this.game.cube.object.rotation.toVector3() ) );
	        this.group.rotation.setFromVector3( this.snapRotation( this.group.rotation.toVector3() ) );
	        this.deselectLayer( this.flipLayer );

	        callback( layer );

	      },
	    } );

	  }

	  bounceCube() {

	    let fixDelta = true;

	    return ( progress, delta, rotation ) => {

	        if ( progress >= 1 ) {

	          if ( fixDelta ) {

	            delta = ( progress - 1 ) * rotation;
	            fixDelta = false;

	          }

	          this.game.cube.object.rotateOnAxis( this.flipAxis, delta );

	        }

	    }

	  }

	  rotateCube( rotation, callback ) {

	    this.rotationTween = new Tween( {
	      duration: this.flipSpeed,
	      easing: Easing.Back.Out( this.flipBounce ),
	      onUpdate: tween => {

	        this.edges.rotateOnWorldAxis( this.flipAxis, tween.delta * rotation );
	        this.game.cube.object.rotation.copy( this.edges.rotation );

	      },
	      onComplete: () => {

	        this.edges.rotation.setFromVector3( this.snapRotation( this.edges.rotation.toVector3() ) );
	        this.game.cube.object.rotation.copy( this.edges.rotation );
	        callback();

	      },
	    } );

	  }

	  checkIsSolved() {

	    let solved = true;
	    const layers = { R: [], L: [], U: [], D: [], F: [], B: [] };

	    this.game.cube.pieces.forEach( ( piece, index ) => {

	      const position = this.getPiecePosition( piece );

	      if ( position.x == -1 ) layers.L.push( piece );
	      else if ( position.x == 1 ) layers.R.push( piece );

	      if ( position.y == -1 ) layers.D.push( piece );
	      else if ( position.y == 1 ) layers.U.push( piece );

	      if ( position.z == -1 ) layers.B.push( piece );
	      else if ( position.z == 1 ) layers.F.push( piece );

	    } );

	    Object.keys( layers ).forEach( key => {

	      const edges = layers[ key ].map( piece => piece.userData.edges );

	      if ( edges.shift().filter( v => {

	        return edges.every( a => { return a.indexOf( v ) !== -1 } )

	      } ).length < 1 ) solved = false;

	    } );

	    if ( solved ) this.onSolved();

	  }

	  selectLayer( layer ) {

	    this.group.rotation.set( 0, 0, 0 );
	    this.movePieces( layer, this.game.cube.object, this.group );
	    this.flipLayer = layer;

	  }

	  deselectLayer( layer ) {

	    this.movePieces( layer, this.group, this.game.cube.object );
	    this.flipLayer = null;

	  }

	  movePieces( layer, from, to ) {

	    from.updateMatrixWorld();
	    to.updateMatrixWorld();

	    layer.forEach( index => {

	      const piece = this.game.cube.pieces[ index ];

	      piece.applyMatrix( from.matrixWorld );
	      from.remove( piece );
	      piece.applyMatrix( new THREE.Matrix4().getInverse( to.matrixWorld ) );
	      to.add( piece );

	    } );

	  }

	  getLayer( position ) {

	    const layer = [];
	    let axis;

	    if ( position === false ) {

	      axis = this.getMainAxis( this.flipAxis );
	      position = this.getPiecePosition( this.dragIntersect.object );

	    } else {

	      axis = this.getMainAxis( position );

	    }

	    this.game.cube.pieces.forEach( piece => {

	      const piecePosition = this.getPiecePosition( piece );

	      if ( piecePosition[ axis ] == position[ axis ] ) layer.push( piece.name );

	    } );

	    return layer;

	  }

	  getPiecePosition( piece ) {

	    let position = new THREE.Vector3()
	      .setFromMatrixPosition( piece.matrixWorld )
	      .multiplyScalar( this.game.cube.size );

	    return this.game.cube.object.worldToLocal( position.sub( this.game.cube.animator.position ) ).round();

	  }

	  scrambleCube() {

	    if ( this.scramble == null ) {

	      this.scramble = this.game.scrambler;
	      this.scramble.callback = ( typeof callback !== 'function' ) ? () => {} : callback;

	    }

	    const converted = this.scramble.converted;
	    const move = converted[ 0 ];
	    const layer = this.getLayer( move.position );

	    this.flipAxis = new THREE.Vector3();
	    this.flipAxis[ move.axis ] = 1;

	    this.selectLayer( layer );
	    this.rotateLayer( move.angle, true, () => {

	      converted.shift();

	      if ( converted.length > 0 ) {

	        this.scrambleCube();

	      } else {

	        this.scramble = null;
	        this.game.storage.saveGame();

	      }

	    } );

	  }

	  getIntersect( position, object, multiple ) {

	    this.raycaster.setFromCamera(
	      this.draggable.convertPosition( position.clone() ),
	      this.game.world.camera
	    );

	    const intersect = ( multiple )
	      ? this.raycaster.intersectObjects( object )
	      : this.raycaster.intersectObject( object );

	    return ( intersect.length > 0 ) ? intersect[ 0 ] : false;

	  }

	  getMainAxis( vector ) {

	    return Object.keys( vector ).reduce(
	      ( a, b ) => Math.abs( vector[ a ] ) > Math.abs( vector[ b ] ) ? a : b
	    );

	  }

	  detach( child, parent ) {

	    child.applyMatrix( parent.matrixWorld );
	    parent.remove( child );
	    this.game.world.scene.add( child );

	  }

	  attach( child, parent ) {

	    child.applyMatrix( new THREE.Matrix4().getInverse( parent.matrixWorld ) );
	    this.game.world.scene.remove( child );
	    parent.add( child );

	  }

	  addMomentumPoint( delta ) {

	    const time = Date.now();

	    this.momentum = this.momentum.filter( moment => time - moment.time < 500 );

	    if ( delta !== false ) this.momentum.push( { delta, time } );

	  }

	  getMomentum() {

	    const points = this.momentum.length;
	    const momentum = new THREE.Vector2();

	    this.addMomentumPoint( false );

	    this.momentum.forEach( ( point, index ) => {

	      momentum.add( point.delta.multiplyScalar( index / points ) );

	    } );

	    return momentum;

	  }

	  roundAngle( angle ) {

	    const round = Math.PI / 2;
	    return Math.sign( angle ) * Math.round( Math.abs( angle) / round ) * round;

	  }

	  snapRotation( angle ) {

	    return angle.set(
	      this.roundAngle( angle.x ),
	      this.roundAngle( angle.y ),
	      this.roundAngle( angle.z )
	    );

	  }

	}

	class Scrambler {

		constructor( game ) {

			this.game = game;

			this.scrambleLength = 20;

			this.moves = [];
			this.conveted = [];
			this.pring = '';

		}

		scramble( scramble ) {

			let count = 0;
			this.moves = ( typeof scramble !== 'undefined' ) ? scramble.split( ' ' ) : [];

			if ( this.moves.length < 1 ) {

				const faces = 'UDLRFB';
				const modifiers = [ "", "'", "2" ];
				const total = ( typeof scramble === 'undefined' ) ? this.scrambleLength : scramble;

				// TODO: Other Cube Sizes Scramble

				while ( count < total ) {

					const move = faces[ Math.floor( Math.random() * 6 ) ] + modifiers[ Math.floor( Math.random() * 3 ) ];
					if ( count > 0 && move.charAt( 0 ) == this.moves[ count - 1 ].charAt( 0 ) ) continue;
					if ( count > 1 && move.charAt( 0 ) == this.moves[ count - 2 ].charAt( 0 ) ) continue;
					this.moves.push( move );
					count ++;

				}

			}

			this.callback = () => {};
			this.convert();
			this.print = this.moves.join( ' ' );

			return this;

		}

		convert( moves ) {

			this.converted = [];

			this.moves.forEach( move => {

				const face = move.charAt( 0 );
				const modifier = move.charAt( 1 );

				const axis = { D: 'y', U: 'y', L: 'x', R: 'x', F: 'z', B: 'z' }[ face ];
				const row = { D: -1, U: 1, L: -1, R: 1, F: 1, B: -1 }[ face ];

				const position = new THREE.Vector3();
				position[ { D: 'y', U: 'y', L: 'x', R: 'x', F: 'z', B: 'z' }[ face ] ] = row;

				const angle = ( Math.PI / 2 ) * - row * ( ( modifier == "'" ) ? - 1 : 1 );

				const convertedMove = { position, axis, angle, name: move };

				this.converted.push( convertedMove );
				if ( modifier == "2" ) this.converted.push( convertedMove );

			} );

		}

	}

	class Transition {

	  constructor( game ) {

	    this.game = game;

	    this.tweens = {};
	    this.durations = {};
	    this.data = {};

	    this.activeTransitions = 0;

	  }

	  init() {

	    this.data.cubeY = -0.2;
	    this.data.cameraZoom = 0.85;

	    this.game.controls.disable();

	    this.game.cube.object.position.y = this.data.cubeY;
	    this.game.controls.edges.position.y = this.data.cubeY;
	    this.game.cube.animator.position.y = 4;
	    this.game.cube.animator.rotation.x = - Math.PI / 3;
	    this.game.world.camera.zoom = this.data.cameraZoom;
	    this.game.world.camera.updateProjectionMatrix();

	    this.tweens.buttons = {};
	    this.tweens.timer = [];
	    this.tweens.title = [];
	    this.tweens.best = [];
	    this.tweens.complete = [];
	    this.tweens.range = [];
	    this.tweens.stats = [];

	  }

	  buttons( show, hide ) {

	    const buttonTween = ( button, show ) => {

	      return new Tween( {
	        target: button.style,
	        duration: 300,
	        easing: show ? Easing.Power.Out( 2 ) : Easing.Power.In( 3 ),
	        from: { opacity: show ? 0 : 1 },
	        to: { opacity: show ? 1 : 0 },
	        onUpdate: tween => {

	          const translate = show ? 1 - tween.value : tween.value;
	          button.style.transform = `translate3d(0, ${translate * 1.5}em, 0)`;

	        },
	        onComplete: () => button.style.pointerEvents = show ? 'all' : 'none'
	      } );

	    };

	    hide.forEach( button =>
	      this.tweens.buttons[ button ] = buttonTween( this.game.dom.buttons[ button ], false )
	    );

	    setTimeout( () => show.forEach( button => {

	      this.tweens.buttons[ button ] = buttonTween( this.game.dom.buttons[ button ], true );

	    } ), hide ? 500 : 0 );

	  }

	  cube( show ) {

	    this.activeTransitions++;

	    try { this.tweens.cube.stop(); } catch(e) {}
	    const currentY = this.game.cube.animator.position.y;
	    const currentRotation = this.game.cube.animator.rotation.x;

	    this.tweens.cube = new Tween( {
	      duration: show ? 3000 : 1250,
	      easing: show ? Easing.Elastic.Out( 0.8, 0.6 ) : Easing.Back.In( 1 ),
	      onUpdate: tween => {

	        this.game.cube.animator.position.y = show
	          ? ( 1 - tween.value ) * 4
	          : currentY + tween.value * 4;

	        this.game.cube.animator.rotation.x = show
	          ? ( 1 - tween.value ) * Math.PI / 3
	          : currentRotation + tween.value * - Math.PI / 3;

	      }
	    } );

	    this.durations.cube = show ? 1500 : 1500;

	    setTimeout( () => this.activeTransitions--, this.durations.cube );

	  }

	  float() {

	    try { this.tweens.float.stop(); } catch(e) {}
	    this.tweens.float = new Tween( {
	      duration: 1500,
	      easing: Easing.Sine.InOut(),
	      yoyo: true,
	      onUpdate: tween => {

	        this.game.cube.holder.position.y = (- 0.02 + tween.value * 0.04); 
	        this.game.cube.holder.rotation.x = 0.005 - tween.value * 0.01;
	        this.game.cube.holder.rotation.z = - this.game.cube.holder.rotation.x;
	        this.game.cube.holder.rotation.y = this.game.cube.holder.rotation.x;

	      },
	    } );

	  }

	  zoom( play, time ) {

	    this.activeTransitions++;

	    const zoom = ( play ) ? 1 : this.data.cameraZoom;
	    const duration = ( time > 0 ) ? Math.max( time, 1500 ) : 1500;
	    const rotations = ( time > 0 ) ? Math.round( duration / 1500 ) : 1;
	    const easing = Easing.Power.InOut( ( time > 0 ) ? 2 : 3 );

	    this.tweens.zoom = new Tween( {
	      target: this.game.world.camera,
	      duration: duration,
	      easing: easing,
	      to: { zoom: zoom },
	      onUpdate: () => { this.game.world.camera.updateProjectionMatrix(); },
	    } );

	    this.tweens.rotate = new Tween( {
	      target: this.game.cube.animator.rotation,
	      duration: duration,
	      easing: easing,
	      to: { y: - Math.PI * 2 * rotations },
	      onComplete: () => { this.game.cube.animator.rotation.y = 0; },
	    } );

	    this.durations.zoom = duration;

	    setTimeout( () => this.activeTransitions--, this.durations.zoom );

	  }

	  elevate( complete ) {

	    this.activeTransitions++;

	    const cubeY = 

	    this.tweens.elevate = new Tween( {
	      target: this.game.cube.object.position,
	      duration: complete ? 1500 : 0,
	      easing: Easing.Power.InOut( 3 ),
	      to: { y: complete ? -0.05 : this.data.cubeY }
	    } );

	    this.durations.elevate = 1500;

	    setTimeout( () => this.activeTransitions--, this.durations.elevate );

	  }

	  complete( show, best ) {

	    this.activeTransitions++;

	    const text = best ? this.game.dom.texts.best : this.game.dom.texts.complete;

	    if ( text.querySelector( 'span i' ) === null )
	      text.querySelectorAll( 'span' ).forEach( span => this.splitLetters( span ) );

	    const letters = text.querySelectorAll( '.icon, i' );

	    this.flipLetters( best ? 'best' : 'complete', letters, show );

	    text.style.opacity = 1;

	    const duration = this.durations[ best ? 'best' : 'complete' ];

	    if ( ! show ) setTimeout( () => this.game.dom.texts.timer.style.transform = '', duration );

	    setTimeout( () => this.activeTransitions--, duration );

	  } 

	  stats( show ) {

	    if ( show ) this.game.scores.calcStats();

	    this.activeTransitions++;

	    this.tweens.stats.forEach( tween => { tween.stop(); tween = null; } );

	    let tweenId = -1;

	    const stats = this.game.dom.stats.querySelectorAll( '.stats' );
	    const easing = show ? Easing.Power.Out( 2 ) : Easing.Power.In( 3 );

	    stats.forEach( ( stat, index ) => {

	      const delay = index * ( show ? 80 : 60 );

	      this.tweens.stats[ tweenId++ ] = new Tween( {
	        delay: delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: tween => {

	          const translate = show ? ( 1 - tween.value ) * 2 : tween.value;
	          const opacity = show ? tween.value : ( 1 - tween.value );

	          stat.style.transform = `translate3d(0, ${translate}em, 0)`;
	          stat.style.opacity = opacity;

	        }
	      } );

	    } );

	    this.durations.stats = 0;

	    setTimeout( () => this.activeTransitions--, this.durations.stats );

	  }

	  preferences( show ) {

	    this.activeTransitions++;

	    this.tweens.range.forEach( tween => { tween.stop(); tween = null; } );

	    let tweenId = -1;
	    let listMax = 0;

	    const ranges = this.game.dom.prefs.querySelectorAll( '.range' );
	    const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3);

	    ranges.forEach( ( range, rangeIndex ) => {

	      const label = range.querySelector( '.range__label' );
	      const track = range.querySelector( '.range__track-line' );
	      const handle = range.querySelector( '.range__handle' );
	      const list = range.querySelectorAll( '.range__list div' );

	      const delay = rangeIndex * ( show ? 120 : 100 );

	      label.style.opacity = show ? 0 : 1;
	      track.style.opacity = show ? 0 : 1;
	      handle.style.opacity = show ? 0 : 1;
	      handle.style.pointerEvents = show ? 'all' : 'none';

	      this.tweens.range[ tweenId++ ] = new Tween( {
	        delay: show ? delay : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: tween => {

	          const translate = show ? ( 1 - tween.value ) : tween.value;
	          const opacity = show ? tween.value : ( 1 - tween.value );

	          label.style.transform = `translate3d(0, ${translate}em, 0)`;
	          label.style.opacity = opacity;

	        }
	      } );

	      this.tweens.range[ tweenId++ ] = new Tween( {
	        delay: show ? delay + 100 : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: tween => {

	          const translate = show ? ( 1 - tween.value ) : tween.value;
	          const scale = show ? tween.value : ( 1 - tween.value );
	          const opacity = scale;

	          track.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, 1, 1)`;
	          track.style.opacity = opacity;

	        }
	      } );

	      this.tweens.range[ tweenId++ ] = new Tween( {
	        delay: show ? delay + 100 : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: tween => {

	          const translate = show ? ( 1 - tween.value ) : tween.value;
	          const opacity = 1 - translate;
	          const scale = 0.5 + opacity * 0.5;

	          handle.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, ${scale}, ${scale})`;
	          handle.style.opacity = opacity;

	        }
	      } );

	      list.forEach( ( listItem, labelIndex ) => {

	        listItem.style.opacity = show ? 0 : 1;

	        this.tweens.range[ tweenId++ ] = new Tween( {
	          delay: show ? delay + 200 + labelIndex * 50 : delay,
	          duration: 400,
	          easing: easing,
	          onUpdate: tween => {

	            const translate = show ? ( 1 - tween.value ) : tween.value;
	            const opacity = show ? tween.value : ( 1 - tween.value );

	            listItem.style.transform = `translate3d(0, ${translate}em, 0)`;
	            listItem.style.opacity = opacity;

	          }
	        } );

	      } );

	      listMax = list.length > listMax ? list.length - 1 : listMax;

	      range.style.opacity = 1;

	    } );

	    this.durations.preferences = show
	      ? ( ( ranges.length - 1 ) * 100 ) + 200 + listMax * 50 + 400
	      : ( ( ranges.length - 1 ) * 100 ) + 400;

	    setTimeout( () => this.activeTransitions--, this.durations.preferences );

	  }

	  title( show ) {

	    this.activeTransitions++;

	    const title = this.game.dom.texts.title;

	    if ( title.querySelector( 'span i' ) === null )
	      title.querySelectorAll( 'span' ).forEach( span => this.splitLetters( span ) );

	    const letters = title.querySelectorAll( 'i' );

	    this.flipLetters( 'title', letters, show );

	    title.style.opacity = 1;

	    const note = this.game.dom.texts.note;

	    this.tweens.title[ letters.length ] = new Tween( {
	      target: note.style,
	      easing: Easing.Sine.InOut(),
	      duration: show ? 800 : 400,
	      yoyo: show ? true : null,
	      from: { opacity: show ? 0 : ( parseFloat( getComputedStyle( note ).opacity ) ) },
	      to: { opacity: show ? 1 : 0 },
	    } );

	    setTimeout( () => this.activeTransitions--, this.durations.title );

	  }

	  timer( show ) {

	    this.activeTransitions++;

	    const timer = this.game.dom.texts.timer;

	    timer.style.opacity = 0;
	    this.game.timer.convert();
	    this.game.timer.setText();

	    this.splitLetters( timer );
	    const letters = timer.querySelectorAll( 'i' );
	    this.flipLetters( 'timer', letters, show );

	    timer.style.opacity = 1;

	    setTimeout( () => this.activeTransitions--, this.durations.timer );

	  }

	  // Utilities

	  splitLetters( element ) {

	    const text = element.innerHTML;

	    element.innerHTML = '';

	    text.split( '' ).forEach( letter => {

	      const i = document.createElement( 'i' );

	      i.innerHTML = letter;

	      element.appendChild( i );

	    } );

	  }

	  flipLetters( type, letters, show ) {

	    try { this.tweens[ type ].forEach( tween => tween.stop() ); } catch(e) {}
	    letters.forEach( ( letter, index ) => {

	      letter.style.opacity = show ? 0 : 1;

	      this.tweens[ type ][ index ] = new Tween( {
	        easing: Easing.Sine.Out(),
	        duration: show ? 800 : 400,
	        delay: index * 50,
	        onUpdate: tween => {

	          const rotation = show ? ( 1 - tween.value ) * -80 : tween.value * 80;

	          letter.style.transform = `rotate3d(0, 1, 0, ${rotation}deg)`;
	          letter.style.opacity = show ? tween.value : ( 1 - tween.value );

	        },
	      } );

	    } );

	    this.durations[ type ] = ( letters.length - 1 ) * 50 + ( show ? 800 : 400 );

	  }

	}

	class Timer extends Animation {

		constructor( game ) {

			super( false );

			this.game = game;
			this.reset();
			
		}

		start( continueGame ) {

			this.startTime = continueGame ? ( Date.now() - this.deltaTime ) : Date.now();
			this.deltaTime = 0;
			this.converted = this.convert();

			super.start();

		}

		reset() {

			this.startTime = 0;
			this.currentTime = 0;
			this.deltaTime = 0;
			this.converted = '0:00';

		}

		stop() {

			this.currentTime = Date.now();
			this.deltaTime = this.currentTime - this.startTime;
			this.convert();

			super.stop();

			return { time: this.converted, millis: this.deltaTime };

		}

		update() {

			const old = this.converted;

			this.currentTime = Date.now();
			this.deltaTime = this.currentTime - this.startTime;
			this.convert();

			if ( this.converted != old ) {

				localStorage.setItem( 'gameTime', this.deltaTime );
				this.setText();

			}

		}

		convert() {

			const seconds = parseInt( ( this.deltaTime / 1000 ) % 60 );
			const minutes = parseInt( ( this.deltaTime / ( 1000 * 60 ) ) );

			this.converted = minutes + ':' + ( seconds < 10 ? '0' : '' ) + seconds;

		}

		setText() {

			this.game.dom.texts.timer.innerHTML = this.converted;

		}

	}

	const RangeHTML = [

	  '<div class="range">',
	    '<div class="range__label"></div>',
	    '<div class="range__track">',
	      '<div class="range__track-line"></div>',
	      '<div class="range__handle"></div>',
	    '</div>',
	    '<div class="range__list"></div>',
	  '</div>',

	].join( '\n' );

	document.querySelectorAll( 'range' ).forEach( el => {

	  const temp = document.createElement( 'div' );
	  temp.innerHTML = RangeHTML;

	  const range = temp.querySelector( '.range' );
	  const rangeLabel = range.querySelector( '.range__label' );
	  const rangeList = range.querySelector( '.range__list' );

	  range.setAttribute( 'name', el.getAttribute( 'name' ) );
	  rangeLabel.innerHTML = el.getAttribute( 'title' );

	  el.getAttribute( 'list' ).split( ',' ).forEach( listItemText => {

	    const listItem = document.createElement( 'div' );
	    listItem.innerHTML = listItemText;
	    rangeList.appendChild( listItem );

	  } );

	  el.parentNode.replaceChild( range, el );

	} );

	class Range {

	  constructor( name, options ) {

	    options = Object.assign( {
	      range: [ 0, 1 ],
	      value: 0,
	      step: 0,
	      onUpdate: () => {},
	      onComplete: () => {},
	    }, options || {} );

	    this.element = document.querySelector( '.range[name="' + name + '"]' );
	    this.track = this.element.querySelector( '.range__track' );
	    this.handle = this.element.querySelector( '.range__handle' );

	    this.value = options.value;
	    this.min = options.range[0];
	    this.max = options.range[1];
	    this.step = options.step;

	    this.onUpdate = options.onUpdate;
	    this.onComplete = options.onComplete;

	    this.value = this.round( this.limitValue( this.value ) );
	    this.setHandlePosition();

	    this.initDraggable();

	  }

	  initDraggable() {

	    let current;

	    this.draggable = new Draggable( this.handle, { calcDelta: true } );

	    this.draggable.onDragStart = position => {

	      current = this.positionFromValue( this.value );
	      this.handle.style.left = current + 'px';

	    };

	    this.draggable.onDragMove = position => {

	      current = this.limitPosition( current + position.delta.x );
	      this.value = this.round( this.valueFromPosition( current ) );
	      this.setHandlePosition();
	      
	      this.onUpdate( this.value );

	    };

	    this.draggable.onDragEnd = position => {

	      this.onComplete( this.value );

	    };

	  }

	  round( value ) {

	    if ( this.step < 1 ) return value;

	    return Math.round( ( value - this.min ) / this.step ) * this.step + this.min;

	  }

	  limitValue( value ) {

	    const max = Math.max( this.max, this.min );
	    const min = Math.min( this.max, this.min );

	    return Math.min( Math.max( value, min ), max );

	  }

	  limitPosition( position ) {

	    return Math.min( Math.max( position, 0 ), this.track.offsetWidth );

	  }

	  percentsFromValue( value ) {

	    return ( value - this.min ) / ( this.max - this.min );

	  }

	  valueFromPosition( position ) {

	    return this.min + ( this.max - this.min ) * ( position / this.track.offsetWidth );

	  }

	  positionFromValue( value ) {

	    return this.percentsFromValue( value ) * this.track.offsetWidth;

	  }

	  setHandlePosition() {

	    this.handle.style.left = this.percentsFromValue( this.value ) * 100 + '%';

	  }

	}

	class Preferences {

	  constructor( game ) {

	    this.game = game;

	  }

	  init() {

	    const getProgressInRange = ( value, start, end ) => {

	      return Math.min( Math.max( (value - start) / (end - start), 0 ), 1 );
	      
	    };

	    this.ranges = {

	      speed: new Range( 'speed', {
	        value: this.game.controls.flipSpeed,
	        range: [ 350, 100 ], 
	        onUpdate: value => {

	          this.game.controls.flipSpeed = value;
	          this.game.controls.flipBounce = getProgressInRange( value, 100, 350 ) * 2.125;

	        },
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      scramble: new Range( 'scramble', {
	        value: this.game.scrambler.scrambleLength,
	        range: [ 20, 30 ],
	        step: 5,
	        onUpdate: value => {

	          this.game.scrambler.scrambleLength = value;

	        },
	        onComplete: () => this.game.storage.savePreferences()
	      } ),

	      fov: new Range( 'fov', {
	        value: this.game.world.fov,
	        range: [ 2, 45 ],
	        onUpdate: value => {

	          this.game.world.fov = value;
	          this.game.world.resize();

	        },
	        onComplete: () => this.game.storage.savePreferences()
	      } ),

	      theme: new Range( 'theme', {
	        value: 0,
	        range: [ 0, 1 ],
	        step: 1,
	        onUpdate: value => {},
	        // onComplete: () => this.game.storage.savePreferences()
	      } ),

	    };
	    
	  }

	}

	class Confetti extends Animation {

	  constructor( game ) {

	    super( false );

	    this.game = game;

	    this.count = 100;
	    this.particles = [];

	    this.object = new THREE.Object3D();
	    this.object.position.y = 0.25;
	    this.game.world.scene.add( this.object );

	    this.geometry = new THREE.PlaneGeometry( 1, 1 );
	    this.material = new THREE.MeshLambertMaterial( { transparent: true, side: THREE.DoubleSide} );
	    this.opacity = 0;
	    this.callback = ( () => {} );

	    this.particleOptions = {
	      geometry: this.geometry,
	      material: this.material,
	      holder: this.object,
	      velocity: { min: 5, max: 20 },
	      revolution: { min: 0, max: 0.05 },
	      angle: { direction: new THREE.Vector3( 0, 1, 0 ), spread: 30 },
	      radius: { min: 10, max: 15 },
	      mass: { min: 0.05, max: 0.1 },
	      gravity: -9.81,
	      geometryScale: 0.01, // used to scale in threejs world
	      positionScale: 0.3333, // used to scale in threejs world
	      colors: [ 0x41aac8, 0x82ca38, 0xffef48, 0xef3923, 0xff8c0a ],
	    };

	    let i = this.count;
	    while ( i-- )  this.particles.push( new Particle( this.particleOptions ) );

	  }

	  start( callback ) {

	    this.opacity = 0;
	    this.done = 0;
	    this.time = performance.now();
	    this.callback = ( typeof callback === 'function') ? callback : () => {};
	    
	    super.start();

	  }

	  stop() {

	    super.stop();

	    let i = this.count;
	    while ( i-- ) this.particles[ i ].reset();

	  }

	  update() {

	    const now = performance.now();
	    const delta = now - this.time;
	    this.time = now;

	    this.opacity += ( 1 - this.opacity ) * 0.1;

	    let i = this.count;
	    while ( i-- ) {

	      if ( this.particles[ i ].update( delta, this.opacity ) ) this.done++;

	    }

	    if ( this.done == this.count) {

	      this.stop();

	      this.callback();
	      this.callback = ( () => {} );

	    }

	  }
	  
	}

	const rnd = THREE.Math.randFloat;

	class Particle {

	  constructor( options ) {

	    this.options = options;

	    this.velocity = new THREE.Vector3();
	    this.force = new THREE.Vector3();

	    this.mesh = new THREE.Mesh( options.geometry, options.material.clone() );

	    options.holder.add( this.mesh );

	    this.reset();

	    this.ag = options.gravity; // -9.81

	    return this;

	  }

	  reset() {

	    const axis = this.velocity.clone();

	    this.velocity.copy( this.options.angle.direction ).multiplyScalar( rnd( this.options.velocity.min, this.options.velocity.max ) );
	    this.velocity.applyAxisAngle( axis.set( 1, 0, 0 ), rnd( -this.options.angle.spread / 2, this.options.angle.spread / 2 ) * THREE.Math.DEG2RAD );
	    this.velocity.applyAxisAngle( axis.set( 0, 0, 1 ), rnd( -this.options.angle.spread / 2, this.options.angle.spread / 2 ) * THREE.Math.DEG2RAD );

	    this.color = new THREE.Color( this.options.colors[ Math.floor( Math.random() * this.options.colors.length ) ] );

	    this.revolution = new THREE.Vector3(
	      rnd( this.options.revolution.min, this.options.revolution.max ),
	      rnd( this.options.revolution.min, this.options.revolution.max ),
	      rnd( this.options.revolution.min, this.options.revolution.max )
	    );

	    this.mesh.position.set( 0, 0, 0 );

	    this.positionScale = this.options.positionScale;
	    this.mass = rnd( this.options.mass.min, this.options.mass.max );
	    this.radius = rnd( this.options.radius.min, this.options.radius.max );
	    this.scale = this.radius * this.options.geometryScale;

	    this.mesh.scale.set( this.scale, this.scale, this.scale );
	    this.mesh.material.color.set( this.color );
	    this.mesh.material.opacity = 0;
	    this.mesh.rotation.set( Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2 );

	    this.physics = this.getPhysics( this.radius );

	    this.done = false;

	  }

	  update( delta, opacity, complete ) {

	    if ( this.done ) return false;

	    delta = 16 / 1000;

	    this.force.set(
	      this.getForce( this.velocity.x ),
	      this.getForce( this.velocity.y ) + this.ag,
	      this.getForce( this.velocity.z )
	    );

	    this.velocity.add( this.force.multiplyScalar( delta ) );

	    this.mesh.position.add( this.velocity.clone().multiplyScalar( delta * this.positionScale ) );
	    this.mesh.rotateX( this.revolution.x ).rotateY( this.revolution.y ).rotateZ( this.revolution.y );
	    this.mesh.material.opacity = opacity * this.getProgressInRange( this.mesh.position.y, -4, -2 );

	    if ( this.mesh.position.y < -4 ) { 
	      
	      this.done = true;
	      return true;

	    }

	    return false;

	  }

	  getPhysics( r ) {

	    const Cd = 0.47;
	    const rho = 1.22;
	    const A = Math.PI * r * r / 10000;

	    return -0.5 * Cd * rho * A;

	  }

	  getForce( velocity ) {

	    return this.physics * velocity * velocity * Math.sign( velocity ) / this.mass;

	  }

	  getProgressInRange( value, start, end ) {

	    return Math.min( Math.max( (value - start) / (end - start), 0 ), 1 );
	    
	  }

	}

	class Scores {

	  constructor( game ) {

	    this.game = game;

	    this.scores = [];
	    this.solves = 0;
	    this.best = 0;
	    this.worst = 0;

	  }

	  addScore( time ) {

	    this.scores.push( time );
	    this.solves++;

	    if ( this.scores.lenght > 100 ) this.scores.shift();

	    let bestTime = false;    

	    if ( time < this.best || this.best === 0 ) {

	      this.best = time;
	      bestTime = true;

	    }

	    if ( time > this.worst ) this.worst = time;

	    this.game.storage.saveScores();

	    return bestTime;

	  }

	  calcStats() {

	    this.setStat( 'total-solves', this.solves );
	    this.setStat( 'best-time', this.convertTime( this.best ) );
	    this.setStat( 'worst-time', this.convertTime( this.worst ) );
	    this.setStat( 'average-5', this.getAverage( 5 ) );
	    this.setStat( 'average-10', this.getAverage( 10 ) );
	    this.setStat( 'average-15', this.getAverage( 15 ) );

	  }

	  setStat( name, value ) {

	    if ( value === 0 ) return;

	    this.game.dom.stats.querySelector( `.stats[name="${name}"] b` ).innerHTML = value;

	  }

	  getAverage( count ) {

	    if ( this.scores.length < count ) return 0;

	    return this.convertTime( this.scores.slice(-count).reduce( ( a, b ) => a + b, 0 ) / count );

	  }

	  convertTime( time ) {

	    if ( time <= 0 ) return 0;

	    const seconds = parseInt( ( time / 1000 ) % 60 );
	    const minutes = parseInt( ( time / ( 1000 * 60 ) ) );

	    return minutes + ':' + ( seconds < 10 ? '0' : '' ) + seconds;

	  }

	}

	class Storage {

	  constructor( game ) {

	    this.game = game;

	    const gameVersion = 2;
	    const userVersion = parseInt( localStorage.getItem( 'version' ) );

	    if ( ! userVersion || userVersion !== gameVersion ) {

	      this.clearGame();
	      this.clearScores();
	      this.clearPreferences();
	      localStorage.setItem( 'version', gameVersion );

	    }

	  }

	  init() {

	    this.loadGame();
	    this.loadScores();
	    this.loadPreferences();

	  }

	  // GAME

	  loadGame() {

	    try {

	      const gameInProgress = localStorage.getItem( 'gameInProgress' ) === 'true';

	      if ( ! gameInProgress ) throw new Error();

	      const gameCubeData = JSON.parse( localStorage.getItem( 'gameCubeData' ) );
	      const gameTime = parseInt( localStorage.getItem( 'gameTime' ) );

	      if ( ! gameCubeData || ! gameTime ) throw new Error();

	      this.game.cube.pieces.forEach( piece => {

	        const index = gameCubeData.names.indexOf( piece.name );

	        const position = gameCubeData.positions[index];
	        const rotation = gameCubeData.rotations[index];

	        piece.position.set( position.x, position.y, position.z );
	        piece.rotation.set( rotation.x, rotation.y, rotation.z );

	      } );

	      this.game.timer.deltaTime = gameTime;

	      this.game.saved = true;

	    } catch( e ) {

	      this.game.saved = false;

	    }

	  }

	  saveGame() {

	    const gameInProgress = true;
	    const gameCubeData = { names: [], positions: [], rotations: [] };
	    const gameTime = this.game.timer.deltaTime;

	    this.game.cube.pieces.forEach( piece => {

	      gameCubeData.names.push( piece.name );
	      gameCubeData.positions.push( piece.position );
	      gameCubeData.rotations.push( piece.rotation.toVector3() );

	    } );

	    localStorage.setItem( 'gameInProgress', gameInProgress );
	    localStorage.setItem( 'gameCubeData', JSON.stringify( gameCubeData ) );
	    localStorage.setItem( 'gameTime', gameTime );

	  }

	  clearGame() {

	    localStorage.removeItem( 'gameInProgress' );
	    localStorage.removeItem( 'gameCubeData' );
	    localStorage.removeItem( 'gameTime' );

	  }

	  // SCORE

	  loadScores() {

	    try {

	      const scoresData = JSON.parse( localStorage.getItem( 'scoresData' ) );
	      const scoresBest = parseInt( localStorage.getItem( 'scoresBest' ) );
	      const scoresWorst = parseInt( localStorage.getItem( 'scoresWorst' ) );
	      const scoresSolves = parseInt( localStorage.getItem( 'scoresSolves' ) );

	      if ( ! scoresData || ! scoresBest || ! scoresSolves || ! scoresWorst ) throw new Error();

	      this.game.scores.scores = scoresData;
	      this.game.scores.best = scoresBest;
	      this.game.scores.solves = scoresSolves;
	      this.game.scores.worst = scoresWorst;

	      return true;

	    } catch( e ) {

	      this.clearScores();

	      return false;

	    }

	  }

	  saveScores() {

	    const scoresData = this.game.scores.scores;
	    const scoresBest = this.game.scores.best;
	    const scoresWorst = this.game.scores.worst;
	    const scoresSolves = this.game.scores.solves;

	    localStorage.setItem( 'scoresData', JSON.stringify( scoresData ) );
	    localStorage.setItem( 'scoresBest', JSON.stringify( scoresBest ) );
	    localStorage.setItem( 'scoresWorst', JSON.stringify( scoresWorst ) );
	    localStorage.setItem( 'scoresSolves', JSON.stringify( scoresSolves ) );

	  }

	  clearScores() {

	    localStorage.removeItem( 'scoresData' );
	    localStorage.removeItem( 'scoresBest' );
	    localStorage.removeItem( 'scoresWorst' );
	    localStorage.removeItem( 'scoresSolves' );

	  }

	  // PREFERENCES

	  loadPreferences() {

	    try {

	      const preferences = JSON.parse( localStorage.getItem( 'preferences' ) );

	      if ( ! preferences ) throw new Error();

	      this.game.controls.flipSpeed = preferences.flipSpeed;
	      this.game.controls.flipBounce = preferences.flipBounce;
	      this.game.scrambler.scrambleLength = preferences.scrambleLength;

	      this.game.world.fov = parseFloat( preferences.fov );
	      this.game.world.resize();

	      return true;

	    } catch (e) {

	      this.game.controls.flipSpeed = 300;
	      this.game.controls.flipBounce = 1.70158;
	      this.game.scrambler.scrambleLength = 20;

	      this.game.world.fov = 10;
	      this.game.world.resize();

	      this.savePreferences();

	      return false;

	    }

	  }

	  savePreferences() {

	    const preferences = {
	      flipSpeed: this.game.controls.flipSpeed,
	      flipBounce: this.game.controls.flipBounce,
	      scrambleLength: this.game.scrambler.scrambleLength,
	      fov: this.game.world.fov,
	      theme: null,
	    };

	    localStorage.setItem( 'preferences', JSON.stringify( preferences ) );

	  }

	  clearPreferences() {

	    localStorage.removeItem( 'preferences' );

	  }

	}

	class IconsConverter {

		constructor( options ) {

			options = Object.assign( {
				tagName: 'icon',
				className: 'icon',
				styles: false,
	      icons: {},
				observe: false,
				convert: false,
			}, options || {} );

			this.tagName = options.tagName;
			this.className = options.className;
			this.icons = options.icons;

			this.svgTag = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
			this.svgTag.setAttribute( 'class', this.className );

			if ( options.styles ) this.addStyles();
			if ( options.convert ) this.convertAllIcons();

			if ( options.observe ) {

				const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
				this.observer = new MutationObserver( mutations => { this.convertAllIcons(); } );
				this.observer.observe( document.documentElement, { childList: true, subtree: true } );

			}

			return this;

		}

		convertAllIcons() {

			document.querySelectorAll( this.tagName ).forEach( icon => { this.convertIcon( icon ); } );

		}

		convertIcon( icon ) {

			const svgData = this.icons[ icon.attributes[0].localName ];

			if ( typeof svgData === 'undefined' ) return;

			const svg = this.svgTag.cloneNode( true );
			const viewBox = svgData.viewbox.split( ' ' );

			svg.setAttributeNS( null, 'viewBox', svgData.viewbox );
			svg.style.width = viewBox[2] / viewBox[3] + 'em';
			svg.style.height = '1em';
			svg.innerHTML = svgData.content;

			icon.parentNode.replaceChild( svg, icon );

		}

		addStyles() {

			const style = document.createElement( 'style' );
	    style.innerHTML = `.${this.className} { display: inline-block; font-size: inherit; overflow: visible; vertical-align: -0.125em; preserveAspectRatio: none; }`;
			document.head.appendChild( style );

		}

	}

	const Icons = new IconsConverter( {

	  icons: {
	    'audio': {
	      viewbox: '0 0 26712 21370',
	      content: '<g fill="currentColor"><path d="M11966 392l-4951 4950 -5680 0c-738,0 -1336,598 -1336,1336l0 8014c0,737 598,1336 1336,1336l5680 0 4951 4950c836,836 2280,249 2280,-944l0 -18696c0,-1194 -1445,-1780 -2280,-944z"/><path d="M18823 6407c-644,-352 -1457,-120 -1815,526 -356,646 -120,1458 526,1815 718,394 1165,1137 1165,1937 0,800 -446,1543 -1164,1937 -646,357 -882,1169 -526,1815 358,649 1171,879 1815,526 1571,-865 2547,-2504 2547,-4278 0,-1774 -976,-3413 -2548,-4277l0 0z"/><path d="M26712 10685c0,-3535 -1784,-6786 -4773,-8695 -623,-397 -1449,-213 -1843,415 -395,628 -210,1459 412,1857 2212,1413 3533,3814 3533,6423 0,2609 -1321,5010 -3533,6423 -623,397 -807,1228 -412,1856 362,577 1175,843 1843,415 2989,-1909 4773,-5159 4773,-8695z"/></g>',
	    },
	    'settings': {
	      viewbox: '0 0 512 512',
	      content: '<path fill="currentColor" d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z" class=""></path>',
	    },
	    'back': {
	      viewbox: '0 0 512 512',
	      content: '<path transform="translate(512, 0) scale(-1,1)" fill="currentColor" d="M503.691 189.836L327.687 37.851C312.281 24.546 288 35.347 288 56.015v80.053C127.371 137.907 0 170.1 0 322.326c0 61.441 39.581 122.309 83.333 154.132 13.653 9.931 33.111-2.533 28.077-18.631C66.066 312.814 132.917 274.316 288 272.085V360c0 20.7 24.3 31.453 39.687 18.164l176.004-152c11.071-9.562 11.086-26.753 0-36.328z" class=""></path>',
	    },
	    'trophy': {
	      viewbox: '0 0 576 512',
	      content: '<path fill="currentColor" d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 66.5 77.9 131.7 171.9 142.4C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6C498.4 275.6 576 210.3 576 144V88c0-13.3-10.7-24-24-24zM64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-47.5-16.4-77-49.9-77-70.2zm448 0c0 20.2-29.4 53.8-77 70.2 7-25 11.8-53.6 12.8-86.2H512v16zm-127.3 4.7l-39.6 38.6 9.4 54.6c1.7 9.8-8.7 17.2-17.4 12.6l-49-25.8-49 25.8c-8.8 4.6-19.1-2.9-17.4-12.6l9.4-54.6-39.6-38.6c-7.1-6.9-3.2-19 6.7-20.5l54.8-8 24.5-49.6c4.4-8.9 17.1-8.9 21.5 0l24.5 49.6 54.8 8c9.6 1.5 13.5 13.6 6.4 20.5z" class=""></path>',
	    },
	    // 'settings': {
	    //   viewbox: '0 0 627 627',
	    //   content: '<g fill-rule="evenodd" clip-rule="evenodd"><path fill="darkgray" d="M386 114l64 37 103 -20 38 66 -69 79 0 74 69 80 -38 66 -103 -20 -64 37 -35 99c-25,0 -50,0 -76,0l-34 -99 -64 -37 -104 20 -38 -66 69 -80 0 -74 -69 -79 38 -66 104 20 64 -37 34 -100c26,0 51,0 76,0l35 100zm-73 94l91 53 0 105 -91 52 -91 -52 0 -105 91 -53z"/><path fill="#7C7C7D" d="M313 178l118 68 0 135 -118 68 -117 -68 0 -135 117 -68zm0 98l38 37 -38 38 -37 -38 37 -37z"/></g>',
	    // },
	    // 'back': {
	    //   viewbox: '0 0 656 656',
	    //   content: '<polygon fill="darkgray" points="254,547 15,328 254,110 254,228 511,228 641,563 425,428 254,428 "/>',
	    // },
	    // 'trophy': {
	    //   viewbox: '0 0 599 599',
	    //   content: '<polygon fill="#41AAC8" points="130,14 469,14 469,144 305,335 300,316 294,335 130,144 "/><rect fill="#368DA7" x="226" y="14" width="147" height="227"/><polygon fill="darkgray" points="300,135 494,248 494,473 300,585 105,473 105,248 "/><polygon fill="#7C7C7D" points="300,213 331,311 433,310 350,370 382,467 300,407 217,467 249,370 166,310 268,311 "/>',
	    // }
	  },

	  convert: true,

	} );

	const MENU = 0;
	const PLAYING = 1;
	const COMPLETE = 2;
	const STATS = 3;
	const PREFS = 4;

	const SHOW = true;
	const HIDE = false;

	class Game {

	  constructor() {

	    this.dom = {
	      game: document.querySelector( '.ui__game' ),
	      texts: document.querySelector( '.ui__texts' ),
	      prefs: document.querySelector( '.ui__prefs' ),
	      stats: document.querySelector( '.ui__stats' ),
	      texts: {
	        title: document.querySelector( '.text--title' ),
	        note: document.querySelector( '.text--note' ),
	        timer: document.querySelector( '.text--timer' ),
	        stats: document.querySelector( '.text--timer' ),
	        complete: document.querySelector( '.text--complete' ),
	        best: document.querySelector( '.text--best-time' ),
	      },
	      buttons: {
	        prefs: document.querySelector( '.btn--prefs' ),
	        back: document.querySelector( '.btn--back' ),
	        stats: document.querySelector( '.btn--stats' ),
	      }
	    };

	    this.world = new World( this );
	    this.cube = new Cube( this );
	    this.controls = new Controls( this );
	    this.scrambler = new Scrambler( this );
	    this.transition = new Transition( this );
	    // this.audio = new Audio( this );
	    this.timer = new Timer( this );
	    this.preferences = new Preferences( this );
	    this.confetti = new Confetti( this );
	    this.scores = new Scores( this );
	    this.storage = new Storage( this );

	    this.initActions();

	    this.state = MENU;
	    this.saved = false;

	    this.storage.init();
	    this.preferences.init();
	    this.transition.init();

	    this.scores.calcStats();

	    setTimeout( () => {

	      this.transition.float();
	      this.transition.cube( SHOW );

	      setTimeout( () => this.transition.title( SHOW ), 700 );
	      setTimeout( () => this.transition.buttons( [ 'prefs', 'stats' ], [] ), 1000 );

	    }, 500 );

	  }

	  initActions() {

	    let tappedTwice = false;

	    this.dom.game.onclick = event => {

	      if ( this.transition.activeTransitions > 0 ) return;
	      if ( this.state === PLAYING ) return;

	      if ( this.state === MENU ) {

	        if ( ! tappedTwice ) {

	          tappedTwice = true;
	          setTimeout( () => tappedTwice = false, 300 );
	          return false;

	        }

	        if ( ! this.saved ) {

	          this.scrambler.scramble();
	          this.controls.scrambleCube();

	        }

	        const duration = this.saved ? 0 : this.scrambler.converted.length * this.controls.scrambleSpeed;

	        this.state = PLAYING;
	        this.saved = true;

	        this.transition.buttons( [], [ 'stats', 'prefs' ] );

	        this.transition.zoom( PLAYING, duration );
	        this.transition.title( HIDE );

	        setTimeout( () => {

	          this.transition.timer( SHOW );
	          this.transition.buttons( [ 'back' ], [] );

	        }, this.transition.durations.zoom - 1000 );

	        setTimeout( () => {

	          this.controls.enable();
	          this.timer.start( true );

	        }, this.transition.durations.zoom );

	      } else if ( this.state === COMPLETE ) {

	        this.state = STATS;
	        this.saved = false;

	        this.transition.timer( HIDE );
	        this.transition.complete( HIDE, this.bestTime );
	        this.transition.cube( HIDE );
	        this.timer.reset();

	        setTimeout( () => {

	          this.cube.reset();

	          this.transition.stats( SHOW );
	          this.transition.elevate( 0 );

	        }, 1000 );

	        return false;

	      } else if ( this.state === STATS ) {

	        this.state = MENU;

	        this.transition.buttons( [ 'stats', 'prefs' ], [] );

	        this.transition.stats( HIDE );

	        setTimeout( () => this.transition.cube( SHOW ), 500 );
	        setTimeout( () => this.transition.title( SHOW ), 1200 );

	      } else if ( this.state === PREFS ) {

	        this.state = MENU;

	        this.transition.buttons( [ 'stats', 'prefs' ], [] );

	        this.transition.preferences( HIDE );

	        setTimeout( () => this.transition.cube( SHOW ), 500 );
	        setTimeout( () => this.transition.title( SHOW ), 1200 );

	      }

	    };

	    this.dom.buttons.back.onclick = event => {

	      if ( this.transition.activeTransitions > 0 ) return;
	      if ( this.state !== PLAYING ) return;

	      this.state = MENU;

	      this.transition.buttons( [ 'stats', 'prefs' ], [ 'back' ] );

	      this.transition.zoom( MENU, 0 );

	      this.controls.disable();
	      this.timer.stop();
	      this.transition.timer( HIDE );

	      setTimeout( () => this.transition.title( SHOW ), this.transition.durations.zoom - 1000 );

	      this.playing = false;
	      this.controls.disable();

	    };

	    this.dom.buttons.prefs.onclick = event => {

	      if ( this.transition.activeTransitions > 0 ) return;

	      this.state = PREFS;

	      this.transition.buttons( [], [ 'stats', 'prefs' ] );

	      this.transition.title( HIDE );
	      this.transition.cube( HIDE );

	      setTimeout( () => this.transition.preferences( SHOW ), 1000 );

	    };

	    this.dom.buttons.stats.onclick = event => {

	      if ( this.transition.activeTransitions > 0 ) return;

	      this.state = STATS;

	      this.transition.buttons( [], [ 'stats', 'prefs' ] );

	      this.transition.title( HIDE );
	      this.transition.cube( HIDE );

	      setTimeout( () => this.transition.stats( SHOW ), 1000 );

	    };

	    this.controls.onMove = data => {

	      // if ( this.audio.musicOn ) this.audio.click.play();

	    };

	    this.controls.onSolved = () => {

	      this.transition.buttons( [], [ 'back' ] );

	      this.state = COMPLETE;
	      this.saved = false;

	      this.controls.disable();
	      this.timer.stop();
	      this.storage.clearGame();

	      this.bestTime = this.scores.addScore( this.timer.deltaTime );

	      this.transition.zoom( MENU, 0 );
	      this.transition.elevate( SHOW );

	      setTimeout( () => this.transition.complete( SHOW, this.bestTime ), 1000 );

	    };

	  }

	}

	const game = new Game();

	window.game = game;

}());
