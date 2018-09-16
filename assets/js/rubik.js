(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.RUBIK = {})));
}(this, (function (exports) { 'use strict';

	class World {

		constructor( container ) {

			this.container = container;

			this.scene = new THREE.Scene();

			this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.container.appendChild( this.renderer.domElement );

			this.camera = new THREE.PerspectiveCamera( 2, 1, 0.1, 10000 );
			this.cameraOffset = new THREE.Vector3( 0, 0.15, 0 );

			this.onAnimate = () => {};
			this.onResize = () => {};

			this.stage = { width: 2, height: 3 };
			this.fov = 10;

			this.createLights();

			const resize = e => {

				this.width = container.offsetWidth;
				this.height = container.offsetHeight;

				this.renderer.setSize( this.width, this.height );

				this.updateCamera();
				this.onResize();

			};

			window.addEventListener( 'resize', resize, false );

			resize();

			const animate = () => {

				stats.end();
				this.renderer.render( this.scene, this.camera );
				this.onAnimate();

				requestAnimationFrame( animate );

			};

			animate();

		}

		createLights() {

			// const lights = this.lights = [

			// 	new THREE.AmbientLight( 0xffffff, 1.65 ),
			// 	new THREE.DirectionalLight( 0xffffff, 0.2 ),
			// 	new THREE.DirectionalLight( 0xffffff, 0.4 ),

			// ];

			// lights[1].position.set( -1, -1,  1 );
			// lights[2].position.set( -1,  1, -1 );

			// this.scene.add( lights[0] );
			// this.scene.add( lights[1] );
			// this.scene.add( lights[2] );

			const lights = this.lights = [
				new THREE.AmbientLight( 0xffffff, 1.25 ),
				new THREE.DirectionalLight( 0xffffff, 0.65 ),
				new THREE.DirectionalLight( 0xffffff, 0.65 ),
			];

			lights[1].position.set( 0.3, 1,  0.6 );
			lights[2].position.set( -0.3, -1,  -0.6 );

			this.scene.add( lights[0] );
			this.scene.add( lights[1] );
			this.scene.add( lights[2] );

		}

		updateCamera() {

		  this.camera.fov = this.fov;
		  this.camera.aspect = this.width / this.height;

			const aspect = this.stage.width / this.stage.height;
		  const fovRad = this.fov * THREE.Math.DEG2RAD;

		  let distance = ( aspect < this.camera.aspect )
				? ( this.stage.height / 2 ) / Math.tan( fovRad / 2 )
				: ( this.stage.width / this.camera.aspect ) / ( 2 * Math.tan( fovRad / 2 ) );

		  distance /= 2.1;

			this.camera.position.set( distance, distance, distance);
			this.camera.lookAt( this.cameraOffset );
			this.camera.updateProjectionMatrix();

		}

		addCube( cube ) {

			cube.world = this;
			this.cube = cube;

			this.scene.add( cube.object );
			this.scene.add( cube.shadow );

		}

		addAudio( audio ) {

			audio.world = this;
			this.audio = audio;

			this.camera.add( audio.listener );

		}

		addControls( controls ) {

			controls.world = this;
			this.controls = controls;

			this.scene.add( controls.helper );
			this.scene.add( controls.group );
			controls.draggable.init( this.container );

		}

	}

	class Audio {

	  constructor( button, animate ) {

	    this.button = button;
	    this.animate = animate;

	    this.listener = new THREE.AudioListener();

	    this.music = new THREE.Audio( this.listener );
	    this.click = new THREE.Audio( this.listener );

	    this.musicOn = localStorage.getItem( 'music' );
	    this.musicOn = ( this.musicOn == null ) ? false : ( ( this.musicOn == 'true' ) ? true : false );

	    const audioLoader = new THREE.AudioLoader();

	    audioLoader.load( 'assets/sounds/music.mp3', buffer => {

	      this.music.setBuffer( buffer );
	      this.music.setLoop( true );
	      this.music.setVolume( 0.5 );

	      if ( this.musicOn ) {

	        this.animate.audioIn( this );

	      }

	    });

	    audioLoader.load( 'assets/sounds/click.mp3', buffer => {

	      this.click.setBuffer( buffer );
	      this.click.setLoop( false );
	      this.click.setVolume( 0.5 );

	    });

	    this.button.addEventListener( 'click', () => {

	      this.musicOn = !this.musicOn;

	      if ( this.musicOn && !this.button.gameStarted ) {

	        this.animate.audioIn( this );

	      } else {

	        this.animate.audioOut( this );

	      }

	      this.button.classList[ this.musicOn ? 'add' : 'remove' ]('is-active');

	      localStorage.setItem( 'music', this.musicOn );

	    }, false );

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
		const edges = [];

		const edgeScale = 0.85;
		const edgeRoundness = 0.1;
		const pieceRoundness = 0.1;
		const edgeDepth = 0.01;
		const pieceSize = 1 / size;

		const pieceMesh = new THREE.Mesh(
			new RoundedBoxGeometry( pieceSize, pieceSize, pieceSize, pieceSize * pieceRoundness, 3 ),
			new THREE.MeshStandardMaterial( {
				color: colors.piece,
				side: THREE.FrontSide,
				roughness: 1,
				metalness: 0.5,
			} )
		);

		const helper = new THREE.Mesh(
			new THREE.PlaneGeometry( pieceSize, pieceSize, pieceSize ),
			new THREE.MeshBasicMaterial( { depthWrite: false, side: THREE.DoubleSide, transparent: true, opacity: 0 } )
		);

		const edgeGeometry = RoundedPlaneGeometry( - pieceSize / 2, - pieceSize / 2, pieceSize, pieceSize, pieceSize * edgeRoundness, edgeDepth );
		const edgeMaterial = new THREE.MeshStandardMaterial( {
			color: colors.piece,
			side: THREE.FrontSide,
			roughness: 1,
			metalness: 0.5,
		} );

		positions.forEach( ( position, index ) => {

			const piece = new THREE.Object3D();
			const pieceCube = pieceMesh.clone();

			piece.position.copy( position.clone().divideScalar( size ) );
			piece.add( pieceCube );
			piece.name = index;

			position.edges.forEach( position => {

				const edge = createEdge( position );
				const edgeHelper = createEdgeHelper( edge );

				piece.add( edge, edgeHelper );

			} );

			pieces.push( piece );

		} );

		this.pieces = pieces;
		this.edges = edges;

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

		function createEdgeHelper( edge ) {

			const edgeHelper = helper.clone();

			edgeHelper.position.copy( edge.position );
			edgeHelper.rotation.copy( edge.rotation );

			edges.push( edgeHelper );

			return edgeHelper;

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

		constructor( size, options ) {

			size = ( typeof size !== 'undefined' ) ? size : 3;

			this.options = Object.assign( {
				colors: {
					right: 0x41aac8, // blue
					left: 0x82ca38, // green
					top: 0xfff7ff, // white
					bottom: 0xffef48, // yellow
					front: 0xef3923, // red
					back: 0xff8c0a, // orange
					piece: 0x08101a, // black
				},
			}, options || {} );

			this.positions = this.generatePositions( size );
			this.object = new THREE.Object3D();
			this.origin = [];

			const geometry = new CubePieces( size, this.positions, this.options.colors );

			geometry.pieces.forEach( piece => {

				this.object.add( piece );
				this.origin.push( piece.position.clone().multiplyScalar( size ).round() );

			} );

			this.size = size;
			this.pieces = geometry.pieces;
			this.edges = geometry.edges;

			this.generateShadow();

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

		generateShadow() {

			const shadowTexure = 'data:image/png;base64,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';
			const shadowGeometry = new THREE.PlaneGeometry( 2, 2 );
			const shadowMaterial = new THREE.MeshBasicMaterial( {
				depthWrite: true,
				transparent: true,
				opacity: 0.45,
				map: new THREE.TextureLoader().load( shadowTexure )
			} );

			const shadow = new THREE.Mesh( shadowGeometry, shadowMaterial );
			shadow.rotation.x = - Math.PI / 2;
			shadow.position.y = - 1.2;

			this.shadow = shadow;

		}

		loadState() {

			try {

				const gameInProgress = localStorage.getItem( 'gameInProgress' ) == 'yes';

				if ( !gameInProgress ) throw new Error();

				const cubeData = JSON.parse( localStorage.getItem( 'cubeData' ) );
				const gameMoves = JSON.parse( localStorage.getItem( 'gameMoves' ) );
				const gameTime = localStorage.getItem( 'gameTime' );

				if ( !cubeData || !gameMoves || !gameTime ) throw new Error();

				this.pieces.forEach( piece => {

					const index = cubeData.names.indexOf( piece.name );

					const position = cubeData.positions[index];
					const rotation = cubeData.rotations[index];

					piece.position.set( position.x, position.y, position.z );
					piece.rotation.set( rotation.x, rotation.y, rotation.z );

				} );

				this.controls.rearrangePieces();
				this.controls.moves = gameMoves;

				this.controls.moves.forEach( move => {

					const angle = move[0];
					move[0] = new THREE.Vector3( angle.x, angle.y, angle.z );

				} );

				this.world.timer.deltaTime = gameTime;

				return gameInProgress;

			} catch( e ) {

				return false;

			}

		}

		saveState() {
			const timer = this.world.timer;
			const controls = this.controls;

			const cubeData = {
				names: [],
				positions: [],
				rotations: [],
			};

			this.pieces.forEach( piece => {

				cubeData.names.push( piece.name );
			  cubeData.positions.push( piece.position );
			  cubeData.rotations.push( piece.rotation.toVector3() );

			} );

			localStorage.setItem( 'gameInProgress', 'yes' );
			localStorage.setItem( 'cubeData', JSON.stringify( cubeData ) );
			localStorage.setItem( 'gameMoves', JSON.stringify( controls.moves ) );
			localStorage.setItem( 'gameTime', timer.deltaTime );

		}

		clearState() {

			localStorage.removeItem( 'gameInProgress' );
			localStorage.removeItem( 'cubeData' );
			localStorage.removeItem( 'gameMoves' );
			localStorage.removeItem( 'gameTime' );

		}

	}

	class Draggable {

	  constructor() {

	    window.addEventListener( 'touchmove', function () {} );
	    document.addEventListener( 'touchmove', function( event ){ event.preventDefault(); }, { passive: false } );

	    this.position = {
	      start: new THREE.Vector2(),
	      current: new THREE.Vector2(),
	      delta: new THREE.Vector2(),
	      drag: new THREE.Vector2(),
	      old: new THREE.Vector2(),
	      // momentum: new THREE.Vector2(),
	    };

	    // this.momentumPoints = [];
	    this.element = null;
	    this.touch = null;

	    this.drag = {

	      start: ( event ) => {

	        if ( event.type == 'mousedown' && event.which != 1 ) return;
	        if ( event.type == 'touchstart' && event.touches.length > 1 ) return;

	        this.getPositionCurrent( event );
	        this.position.start = this.position.current.clone();
	        this.position.delta.set( 0, 0 );
	        this.position.drag.set( 0, 0 );
	        // this.position.momentum.set( 0, 0 );
	        this.touch = ( event.type == 'touchstart' );

	        this.onDragStart( this.position );

	        window.addEventListener( ( this.touch ) ? 'touchmove' : 'mousemove', this.drag.move, false );
	        window.addEventListener( ( this.touch ) ? 'touchend' : 'mouseup', this.drag.end, false );

	      },

	      move: ( event ) => {

	        this.position.old = this.position.current.clone();
	        this.getPositionCurrent( event );
	        this.position.delta = this.position.current.clone().sub( this.position.old );
	        this.position.drag = this.position.current.clone().sub( this.position.start );
	        // this.addMomentumPoint( this.position.delta );

	        this.onDragMove( this.position );

	      },

	      end: ( event ) => {

	        this.getPositionCurrent( event );
	        // this.getMomentum();

	        this.onDragEnd( this.position );

	        window.removeEventListener( ( this.touch ) ? 'touchmove' : 'mousemove', this.drag.move, false );
	        window.removeEventListener( ( this.touch ) ? 'touchend' : 'mouseup', this.drag.end, false );

	      },

	    };

	    this.onDragStart = () => {};
	    this.onDragMove = () => {};
	    this.onDragEnd = () => {};

	    return this;

	  }

	  init( element ) {

	    this.element = element;
	    this.element.addEventListener( 'touchstart', this.drag.start, false );
	    this.element.addEventListener( 'mousedown', this.drag.start, false );

	    return this;

	  }

	  dispose() {

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
	    position.y = ( position.y / this.element.offsetHeight ) * 2 - 1;

	    return position;

	  }

	  // addMomentumPoint( delta ) {

	  //   const time = Date.now();

	  //   while ( this.momentumPoints.length > 0 ) {

	  //     if ( time - this.momentumPoints[0].time <= 200 ) break;
	  //     this.momentumPoints.shift();

	  //   }

	  //   if ( delta !== false ) this.momentumPoints.push( { delta, time } );

	  // }

	  // getMomentum() {

	  //   const points = this.momentumPoints.length;

	  //   this.addMomentumPoint( false );

	  //   this.momentumPoints.forEach( ( point, index ) => {

	  //     this.position.momentum.add( point.delta.multiplyScalar( index / points ) )

	  //   } );

	  // }

	}

	class Controls {

		constructor( cube, options ) {

			this.options = Object.assign( {
				animationSpeed: 0.2,
				animationBounce: 1.75, // 1.75,
				scrambleSpeed: 0.1,
				scrambleBounce: 0,
				dragDelta: 20,
			}, options || {} );

			this.helper = new THREE.Mesh(
				new THREE.PlaneGeometry( 5, 5 ),
				new THREE.MeshBasicMaterial( {
					depthWrite: false,
					side: THREE.DoubleSide,
					transparent: true,
					opacity: 0.5,
					color: 0xff0000
				} )
			);
			this.helper.position.set( 0, 0, 0 );

			this.raycaster = new THREE.Raycaster();
			this.group = new THREE.Object3D();

			this.moves = [];

			this.intersect = {
				piece: null,
				start: null,
				face: null,
			};

			this.drag = {
				start: null,
				momentum: [],
				active: false, // drag is active
				layer: null, // drag selected layer
				direction: null, // drag direction - temp between start and drag
				rotation: null, // drag rotation axis
				cubeRotation: new THREE.Vector3(),
				type: null, // drag type cube or layer
				angle: null,
				axis: {
					group: null,
					mouse: null,
				},
			};

			this.disabled = false;
			this.world = null;
			this.cube = cube;
			this.scramble = null;

			this.onSolved = () => {};
			this.onMove = () => {};

			cube.controls = this;

			this.draggable = new Draggable();

			this.draggable.onDragStart = ( position ) => {

				if ( this.drag.active || this.drag.rotation != null || this.disabled || this.scramble !== null ) return;

				this.drag.rotation = false;
				this.drag.active = true;

				const intersects = this.getIntersect( position.start, this.cube.edges, true );

				if ( intersects.length > 0 ) {

					this.intersect.start = intersects[ 0 ].point;
					this.intersect.piece = intersects[ 0 ].object.parent;
					this.intersect.face = this.keyMax( this.intersect.start );

					this.drag.type = 'layer';
					this.drag.direction = new THREE.Vector3();
					this.drag.direction[ this.intersect.face ] = 1;
					this.drag.normal = new THREE.Vector2( [ 'x', 'z' ][ this.drag.direction.x ], [ 'y', 'z' ][ this.drag.direction.y ] );
					this.drag.start = this.convertIntersect( this.intersect.start );

					this.helper.position.copy( this.intersect.start );
					this.helper.rotation.set( this.drag.direction.y * Math.PI / 2, this.drag.direction.x * Math.PI / 2, this.drag.direction.z * Math.PI / 2 );

				} else {

					this.drag.normal = new THREE.Vector2( 'x', 'y' );

					this.helper.position.copy( this.cube.object.position );
					this.helper.rotation.set( 0, Math.PI / 4, 0 );
					this.helper.updateMatrixWorld();
					this.intersect.start = this.getCurrentIntersect( position );
					this.drag.start = this.convertIntersect( this.intersect.start );

					this.drag.type = 'cube';

				}

			};

			this.draggable.onDragMove = ( position ) => {

				if ( ! this.drag.active ) return;

				if ( !this.drag.rotation && position.drag.length() > this.options.dragDelta ) {

					const pieceIndex = this.cube.pieces.indexOf( this.intersect.piece );

					let angle = this.convertIntersect( this.getCurrentIntersect( position ) ).sub( this.drag.start ).angle();
					angle = Math.round( angle / ( Math.PI / 2 ) ); if ( angle > 3 ) angle = 0;

					this.drag.axis.mouse = [ 'x', 'y', 'x', 'y' ][ angle ];

			    this.drag.axis.group = ( this.drag.type == 'layer' )
			    	?	( this.drag.axis.mouse == 'y' )
				    	? ( ( this.drag.direction.x != 1 ) ? 'x' : 'z' )
				    	: ( ( this.drag.direction.y != 1 ) ? 'y' : 'z' )
				    : ( this.drag.axis.mouse == 'y' )
							? ( ( position.start.x < this.world.width / 2 ) ? 'x' : 'z' )
							: 'y';

					this.selectLayer( ( this.drag.type == 'layer' )
						? this.getLayer()
						: Array.apply( null, { length: 3 * 3 * 3 } ).map( Number.call, Number )
					);

					// this.drag.deltas = [];
					this.drag.deltaAngle = 0;
				  this.drag.rotation = true;

				} else if ( this.drag.rotation ) {

					const currentIntersect = this.convertIntersect( this.getCurrentIntersect( position ) );
					const dragDelta = currentIntersect.clone().sub( this.drag.start );
					this.drag.start = currentIntersect;

					dragDelta.multiplyScalar( this.deltaFix() );
					this.addMomentumPoint( dragDelta );

					const axis = new THREE.Vector3(); axis[ this.drag.axis.group ] = 1;

					this.group.rotateOnWorldAxis( axis, dragDelta[ this.drag.axis.mouse ] );
					this.drag.deltaAngle += dragDelta[ this.drag.axis.mouse ];

			    // if ( Math.abs( this.drag.deltaAngle ) > Math.PI * 0.25 ) this.draggable.onDragEnd();

				}

			}; 

			this.draggable.onDragEnd = ( position ) => {

				if ( ! this.drag.active || this.drag.layer === null ) return;
				this.drag.active = false;

				const momentum = Math.abs( this.getMomentum()[ this.drag.axis.mouse ] );

				// const deltas = ( typeof this.drag.deltas === 'object' ) ?
				//  this.drag.deltas.reduce( ( a, b ) => a + b ) : 0;
				// const flip = Math.sign( deltas ) == Math.sign( this.drag.deltaAngle );

				const newAngle = this.group.rotation.toVector3();
				if ( momentum > 0.2 ) newAngle[ this.drag.axis.group ] +=
					Math.sign( this.drag.deltaAngle ) * Math.PI * 0.25;

				const angle = this.snapRotation( newAngle );
				const layer = this.drag.layer;

				this.rotateLayer( angle, this.options.animationSpeed, true, () => {

					if ( this.drag.type == 'layer' ) {
						this.addMove( angle, layer );
						this.checkIsSolved();
					}

				} );

			};

			return this;

		}

		disable() {

			this.draggable.dispose();

			return this;

		}

		rotateLayer( angle, speed, flip, callback ) {

			const bounce = ( flip )
				? this.options.animationBounce
				: this.options.scrambleBounce;

			if ( this.drag.layer == null ) return;

			TweenMax.to( this.group.rotation, speed, {
				x: angle.x,
				y: angle.y,
				z: angle.z,
				ease: Back.easeOut.config( bounce ),
				onComplete: () => {

					this.deselectLayer( this.drag.layer );
					if ( typeof callback === 'function' ) callback();

				},
			} );

		}

		addMove( angle, layer ) {

			let move = null;

			if ( new THREE.Vector3().equals( angle ) ) return;

			if (
				this.moves.length > 0 &&
				this.moves[ this.moves.length - 1 ][ 0 ].clone().multiplyScalar( - 1 ).equals( angle )
			) {

				this.moves.pop();

			} else {

				move = [ angle, layer ];
				this.moves.push( move );

			}

			this.onMove( { moves: this.moves, move: move, length: this.moves.length } );

		}

		undo() {

			if ( this.moves.length > 0 ) {

				const move = this.moves[ this.moves.length - 1 ];
				const angle = move[ 0 ].multiplyScalar( - 1 );
				const layer = move[ 1 ];

				this.selectLayer( layer );

				this.rotateLayer( angle, this.options.animationSpeed, true, () => {

					this.moves.pop();
					this.onMove( { moves: this.moves, move: move, length: this.moves.length } );

				} );

			}

		}

		selectLayer( layer ) {

			this.group.rotation.set( 0, 0, 0 );
			this.movePieces( layer, this.cube.object, this.group );

			this.drag.layer = layer;

		}

		deselectLayer( layer ) {

			if ( this.drag.type == 'cube' ) {
				const axis = this.keyMax( this.group.rotation.toVector3() );
				const rotation = this.group.rotation[ axis ];
				const axisVector = new THREE.Vector3();
				axisVector[ axis ] = 1;

				this.cube.object.rotateOnWorldAxis( axisVector, rotation );
			}

			this.movePieces( layer, this.group, this.cube.object );

			this.drag.layer = null;
			this.drag.rotation = null;

			if ( this.scramble === null ) this.cube.saveState();

		}

		movePieces( layer, from, to ) {

			from.updateMatrixWorld();
			to.updateMatrixWorld();

			layer.forEach( index => {

				const piece = this.cube.pieces[ index ];

				piece.applyMatrix( from.matrixWorld );
				from.remove( piece );
				piece.applyMatrix( new THREE.Matrix4().getInverse( to.matrixWorld ) );
				to.add( piece );

			} );

		}

		deltaFix() {

			let deltaFix = 1;

			if ( this.drag.type == 'layer' ) {

				if ( this.intersect.face == 'z' && this.drag.axis.group == 'x' ) deltaFix *= -1;
				if ( this.intersect.face == 'y' && this.drag.axis.group == 'z' ) deltaFix *= -1;
				if ( this.intersect.face == 'x' && this.drag.axis.group == 'y' ) deltaFix *= -1;

			} else {

				if ( this.drag.axis.group == 'x' ) deltaFix *= -1;
				if ( this.drag.axis.group == 'y' ) deltaFix *= 2;

			}

			return deltaFix;

		}

		checkIsSolved() {

			let solved = true;

			this.cube.pieces.forEach( ( piece, index ) => {

				const position = piece.position.clone().multiplyScalar( this.cube.size ).round();
				if ( ! position.equals( this.cube.origin[ index ] ) ) solved = false;

			} );

			return solved;

		}

		getIntersect( position, object, multiple ) {

			const convertedPosition = this.draggable.convertPosition( position.clone() );
			convertedPosition.y *= - 1;

			this.raycaster.setFromCamera( convertedPosition, this.world.camera );

			return ( multiple )
				? this.raycaster.intersectObjects( object )
				: this.raycaster.intersectObject( object );

		}

		getCurrentIntersect( position ) {

			return this.getIntersect( position.current, this.helper, false )[ 0 ].point;

		}

		convertIntersect( point ) {

			return new THREE.Vector2(
				point[ this.drag.normal.x ] * 1,
				point[ this.drag.normal.y ] * 1
			);

		}

		getLayer( position ) {

			const layer = [];
			let axis;

			if ( typeof position === 'undefined' ) {

				position = new THREE.Vector3()
					.setFromMatrixPosition( this.intersect.piece.matrixWorld )
					.multiplyScalar( this.cube.size ).round();

				axis = ( this.drag.axis.mouse == 'y' )
					? ( ( this.intersect.face == 'x' ) ? 'z' : 'x' )
					: ( ( this.intersect.face == 'y' ) ? 'z' : 'y' );

			} else {

				axis = this.keyMax( position );

			}

			this.cube.pieces.forEach( piece => {

				const piecePosition = new THREE.Vector3()
					.setFromMatrixPosition( piece.matrixWorld )
					.multiplyScalar( this.cube.size ).round();

				if ( piecePosition[ axis ] == position[ axis ] ) layer.push( piece.name );

			} );

			return layer;

		}

		scrambleCube( scramble, callback ) {

			if ( this.scramble == null ) {

				scramble.callback = ( typeof callback !== 'function' ) ? () => {} : callback;
				this.scramble = scramble;

			}

			const converted = this.scramble.converted;
			const move = converted[ 0 ];
			const layer = this.getLayer( move.position );
			const rotation = new THREE.Vector3();

			rotation[ move.axis ] = move.angle;

			this.selectLayer( layer );
			this.rotateLayer( rotation, this.options.scrambleSpeed, false, () => {

				converted.shift();

				if ( converted.length > 0 ) {

					this.scrambleCube();

				} else {

					this.scramble.callback();
					this.scramble = null;

				}

			} );

		}

		roundAngle( angle ) {

			const round = Math.PI / 2;

			return Math.sign( angle ) * Math.round( Math.abs( angle) / round ) * round;

		}

		snapRotation( angle ) {

			angle.set(
				this.roundAngle( angle.x ),
				this.roundAngle( angle.y ),
				this.roundAngle( angle.z )
			);

			return angle;

		}

		keyMax( object ) {
			return Object.keys( object )
			.reduce( ( a, b ) => Math.abs( object[ a ] ) > Math.abs( object[ b ] ) ? a : b );
		}

		addMomentumPoint( delta ) {

	    const time = Date.now();

	    while ( this.drag.momentum.length > 0 ) {

	      if ( time - this.drag.momentum[0].time <= 200 ) break;
	      this.drag.momentum.shift();

	    }

	    if ( delta !== false ) this.drag.momentum.push( { delta, time } );

	  }

	  getMomentum() {

	    const points = this.drag.momentum.length;
	    const momentum = new THREE.Vector2();

	    this.addMomentumPoint( false );

	    this.drag.momentum.forEach( ( point, index ) => {

	      momentum.add( point.delta.multiplyScalar( index / points ) );

	    } );

	    return momentum;

	  }

	}

	class Scramble {

		constructor( cube, times ) {

			let count = 0;
			const moves = ( typeof times === 'string' ) ? times.split( ' ' ) : [];

			if ( moves.length < 1 ) {

				const faces = 'UDLRFB';
				const modifiers = [ "", "'", "2" ];
				const total = ( typeof times === 'undefined' ) ? 25 : times;

				// TODO: Other Cube Sizes Scramble

				while ( count < total ) {

					const move = faces[ Math.floor( Math.random() * 6 ) ] + modifiers[ Math.floor( Math.random() * 3 ) ];
					if ( count > 0 && move.charAt( 0 ) == moves[ count - 1 ].charAt( 0 ) ) continue;
					if ( count > 1 && move.charAt( 0 ) == moves[ count - 2 ].charAt( 0 ) ) continue;
					moves.push( move );
					count ++;

				}

			}

			this.callback = () => {};
			this.moves = moves;
			this.print = moves.join( ' ' );
			this.convert();

			return this;

		}

		convert() {

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

			return this.converted;

		}

	}

	class Timer {

		constructor( world, element ) {

			this.element = element;
			this.startTime = null;

			this.world = world;
			world.timer = this;

		}

		start( continueGame ) {

			this.startTime = ( continueGame ) ? ( Date.now() - this.deltaTime ) : Date.now();
			this.deltaTime = 0;

			this.seconds = 0;
			this.minutes = 0;

			this.world.onAnimate = () => {

				this.currentTime = Date.now();
				this.deltaTime = this.currentTime - this.startTime;
				this.element.innerHTML = this.convert( this.deltaTime );

			};

		}

		stop() {

			this.currentTime = Date.now();
			this.deltaTime = this.currentTime - this.startTime;

			world.onAnimate = () => {};

			return { time: this.convert( this.deltaTime ), millis: this.deltaTime };

		}

		convert( time ) {

			// const millis = parseInt( ( time % 1000 ) / 100 );
			const oldSeconds = this.seconds;

			this.seconds = parseInt( ( time / 1000 ) % 60 );
			this.minutes = parseInt( ( time / ( 1000 * 60 ) ) /*% 60*/ );

			if ( oldSeconds !== this.seconds ) localStorage.setItem( 'gameTime', JSON.stringify( time ) );

			return this.minutes + ':' + ( this.seconds < 10 ? '0' : '' ) + this.seconds; // + '.' + millis;

		}

	}

	class Animate {

	  constructor( cube, title, time ) {

	    this.cube = cube;
	    this.title = title;
	    this.time = time;
	    this.tweens = {};

	    this.title.querySelectorAll('span').forEach( span => {

	      const spanText = span.innerHTML;
	      span.innerHTML = '';

	      spanText.split( '' ).forEach( letter => {

	        const i = document.createElement( 'i' );
	        i.innerHTML = letter;
	        i.style.opacity = 0;
	        span.appendChild( i );

	      } );

	    } );

	    this.title.style.opacity = 1;

	  }

	  titleIn( callback ) {

	    this.tweens.title = TweenMax.staggerFromTo( this.title.querySelectorAll( 'i' ), 0.8,
	      { opacity: 0, rotationY: -90 },
	      { opacity: 1, rotationY: 0, ease: Sine.easeOut },
	    0.05, () => { if ( typeof callback === 'function') callback(); } );

	  }

	  titleOut( callback ) {

	    this.tweens.title = TweenMax.staggerFromTo( this.title.querySelectorAll( 'i' ), 0.4,
	      { opacity: 1, rotationY: 0 },
	      { opacity: 0, rotationY: 90, ease: Sine.easeIn },
	    0.05, () => { if ( typeof callback === 'function') callback(); } );

	  }

	  dropAndFloat( callback ) {

	    const cube = this.cube.object;
	    const shadow = this.cube.shadow;
	    const tweens = this.tweens;

	    cube.position.y = 4; 
	    cube.position.x = -2; 
	    cube.position.z = -2; 
	    cube.rotation.x = Math.PI/4;
	    // cube.rotation.y = Math.PI/6;
	    shadow.material.opacity = 0;

	    TweenMax.to( shadow.material, 1.5, { opacity: 0.5, ease: Power1.easeOut, delay: 1 } ); 
	    TweenMax.to( cube.rotation, 2.5, { x: 0, y: 0, ease: Power1.easeOut } ); 
	    TweenMax.to( cube.position, 2.5, { x: 0, y: - 0.1, z: 0, ease: Power1.easeOut, onComplete: () => { 
	     
	      tweens.cube = TweenMax.fromTo( cube.position, 1.5, 
	        { y: - 0.1 }, 
	        { y: + 0.1, repeat: -1, yoyo: true, ease: Sine.easeInOut } 
	      ); 
	     
	      tweens.shadow = TweenMax.fromTo( shadow.material, 1.5, 
	        { opacity: 0.5 }, 
	        { opacity: 0.3, repeat: -1, yoyo: true, ease: Sine.easeInOut } 
	      ); 

	      callback();

	    } } ); 

	  }

	  game( callback, time, start ) {

	    const cube = this.cube.object;
	    const shadow = this.cube.shadow;
	    const camera = this.cube.world.camera;
	    const tweens = this.tweens;
	    const zoomDuration = 0.5;

	    tweens.cube.kill();
	    tweens.shadow.kill();

	    if ( !start ) {

	      tweens.cube = TweenMax.to( cube.position, 0.75, { y: 0.1, ease: Sine.easeOut } );
	      tweens.shadow = TweenMax.to( shadow.material, 0.75, { opacity: 0.5, ease: Sine.easeOut, onComplete: () => {

	        tweens.cube = TweenMax.fromTo( cube.position, 1.5, 
	          { y: 0.1 }, 
	          { y: -0.1, repeat: -1, yoyo: true, ease: Sine.easeInOut } 
	        );

	        tweens.shadow = TweenMax.fromTo( shadow.material, 1.5, 
	          { opacity: 0.5 }, 
	          { opacity: 0.3, repeat: -1, yoyo: true, ease: Sine.easeInOut } 
	        ); 

	      } } );

	    } else {

	      tweens.cube = TweenMax.to( cube.position, zoomDuration, { y: 0, ease: Sine.easeInOut } );
	      tweens.shadow = TweenMax.to( shadow.material, zoomDuration, { opacity: 0.4, ease: Sine.easeInOut, onComplete: () => {

	        if ( time != 0 ) callback();

	      } } );

	    }

	    const duration =  ( time > 0 ) ? time + zoomDuration : zoomDuration * 2;
	    const rotations = ( time > 0 ) ? Math.min( Math.round( duration / 2 ), 1 ) * 2 : 2;

	    const div = document.createElement( 'div' );
	    const value = { old: 0, current: 0, delta: 0 };
	    const matrix = new THREE.Matrix4();

	    const cameraZoom = ( start ) ? 0.95 : 0.8;

	    tweens.cameraZoom = TweenMax.to( camera, duration, { zoom: cameraZoom, ease: Sine.easeInOut, onUpdate: () => {

	      camera.updateProjectionMatrix();

	    } } );

	    tweens.cameraRotation = TweenMax.to( div, duration, { x: Math.PI * rotations, ease: Sine.easeInOut, onUpdate: () => {

	      value.current = this.tweens.cameraRotation.target._gsTransform.x;
	      value.delta = value.current - value.old;
	      value.old = value.current * 1;

	      matrix.makeRotationY( value.delta );
	      camera.position.applyMatrix4( matrix );
	      camera.lookAt( this.cube.world.cameraOffset );

	    }, onComplete: () => {

	      if ( time == 0 ) callback();

	    } } );

	  }

	  audioIn( audio ) {

	    if ( !audio.musicOn ) return;

	    const sound = audio.music;

	    const currentVolume = { volume: 0 };

	    sound.play();

	    if ( this.tweens.volumeTween ) this.tweens.volumeTween.kill();

	    this.tweens.volumeTween = TweenMax.to( currentVolume, 1, { volume: 0.5, ease: Sine.easeOut, onUpdate: () => {

	      sound.setVolume( this.tweens.volumeTween.target.volume );

	      audio.button.classList[ sound.isPlaying ? 'add' : 'remove' ]('is-active');

	    } } );

	  }

	  audioOut( audio ) {

	    const sound = audio.music;

	    const currentVolume = { volume: sound.getVolume() };

	    if ( this.tweens.volumeTween ) this.tweens.volumeTween.kill();

	    this.tweens.volumeTween = TweenMax.to( currentVolume, 1, { volume: 0, ease: Sine.easeOut, onUpdate: () => {

	      sound.setVolume( this.tweens.volumeTween.target.volume );

	    }, onComplete: () => {

	      sound.pause();

	    } } );

	  }

	}

	class SvgIcons {

		constructor( options ) {

			options = Object.assign( {
				tagName: 'icon',
				className: 'icon',
				icons: {},
				styles: true,
				observe: true,
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
			style.innerHTML = `
			.${this.className} {
				display: inline-block;
				font-size: inherit;
				overflow: visible;
				vertical-align: -0.125em;
				preserveAspectRatio: none;
			}`;
			document.head.appendChild( style );

		}

	}

	function Init() {

	  // CONVERT SVG ICONS

	  const svgIcons = new RUBIK.SvgIcons( {
	    observer: false,
	    convert: true,
	    icons: {
	      'audio': {
	        viewbox: '0 0 26712 21370',
	        content: '<g fill="currentColor"><path d="M11966 392l-4951 4950 -5680 0c-738,0 -1336,598 -1336,1336l0 8014c0,737 598,1336 1336,1336l5680 0 4951 4950c836,836 2280,249 2280,-944l0 -18696c0,-1194 -1445,-1780 -2280,-944z"/><path d="M18823 6407c-644,-352 -1457,-120 -1815,526 -356,646 -120,1458 526,1815 718,394 1165,1137 1165,1937 0,800 -446,1543 -1164,1937 -646,357 -882,1169 -526,1815 358,649 1171,879 1815,526 1571,-865 2547,-2504 2547,-4278 0,-1774 -976,-3413 -2548,-4277l0 0z"/><path d="M26712 10685c0,-3535 -1784,-6786 -4773,-8695 -623,-397 -1449,-213 -1843,415 -395,628 -210,1459 412,1857 2212,1413 3533,3814 3533,6423 0,2609 -1321,5010 -3533,6423 -623,397 -807,1228 -412,1856 362,577 1175,843 1843,415 2989,-1909 4773,-5159 4773,-8695z"/></g>',
	      },
	      'settings': {
	        viewbox: '0 0 512 512',
	        content: '<path fill="currentColor" d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z" class=""></path>',
	      },
	      'home': {
	        viewbox: '0 0 576 512',
	        content: '<path fill="currentColor" d="M488 312.7V456c0 13.3-10.7 24-24 24H348c-6.6 0-12-5.4-12-12V356c0-6.6-5.4-12-12-12h-72c-6.6 0-12 5.4-12 12v112c0 6.6-5.4 12-12 12H112c-13.3 0-24-10.7-24-24V312.7c0-3.6 1.6-7 4.4-9.3l188-154.8c4.4-3.6 10.8-3.6 15.3 0l188 154.8c2.7 2.3 4.3 5.7 4.3 9.3zm83.6-60.9L488 182.9V44.4c0-6.6-5.4-12-12-12h-56c-6.6 0-12 5.4-12 12V117l-89.5-73.7c-17.7-14.6-43.3-14.6-61 0L4.4 251.8c-5.1 4.2-5.8 11.8-1.6 16.9l25.5 31c4.2 5.1 11.8 5.8 16.9 1.6l235.2-193.7c4.4-3.6 10.8-3.6 15.3 0l235.2 193.7c5.1 4.2 12.7 3.5 16.9-1.6l25.5-31c4.2-5.2 3.4-12.7-1.7-16.9z" class=""></path>',
	      },
	    },
	  } );

	  // SET OPTIONS

	  const scrambleLength = 20;

	  // SELECT DOM ELEMENTS

	  const game = document.querySelector( '.game' );
	  const ui = document.querySelector( '.ui' );
	  const title = document.querySelector( '.ui__title' );
	  const start = document.querySelector( '.ui__button--start' );
	  const homeButton = document.querySelector( '.ui__icon--home' );
	  const audioButton = document.querySelector( '.ui__icon--audio' );
	  const time = document.querySelector( '.ui__timer' );
	  const moves = document.querySelector( '.ui__moves' );
	  const undo = document.querySelector( '.ui__undo' );

	  // CREATE RUBIK GAME

	  const world = new RUBIK.World( game );
	  const cube = new RUBIK.Cube( 3 );
	  const controls = new RUBIK.Controls( cube );
	  const timer = new RUBIK.Timer( world, time );
	  const animate = new RUBIK.Animate( cube, title, time );
	  const audio = new RUBIK.Audio( audioButton, animate );

	  world.addCube( cube );
	  world.addControls( controls );
	  world.addAudio( audio );

	  // world.camera.zoom = 0.8;
	  // world.camera.updateProjectionMatrix();

	  // controls.disabled = true;

	  // LOAD GAME

	  // let gameSaved = cube.loadState();
	  // let gameStarted = false;
	  // audioButton.gameStarted = false;

	  // start.innerHTML = gameSaved ? 'CONTINUE' : 'NEW GAME';

	  // START GAME

	  // animate.dropAndFloat( () => {

	  //   animate.titleIn( () => {} );

	  //   ui.classList.add('in-menu');

	  // } );

	  // BUTTON LISTENERS

	  start.onclick = function ( event ) {

	    if ( audio.musicOn ) animate.audioOut( audio );

	    gameStarted = true;
	    audioButton.gameStarted = true;

	    const scramble = ( gameSaved ) ? null : new RUBIK.Scramble( cube, scrambleLength );

	    ui.classList.remove('in-menu');

	    animate.titleOut( () => {} );

	    animate.game( () => {

	      if ( !gameSaved ) {

	        controls.scrambleCube( scramble, function () {

	          ui.classList.add('in-game');

	          timer.start( false );

	          cube.saveState();

	          controls.disabled = false;

	        } );

	      } else {

	        ui.classList.add('in-game');
	        timer.start( true );

	      }

	      controls.disabled = false;

	    }, ( gameSaved ) ? 0 : scramble.converted.length * controls.options.scrambleSpeed, true );

	  };

	  // undo.onclick = function ( event ) {

	  //   controls.undo();

	  // };

	  controls.onMove = function ( data ) {

	    // moves.innerHTML = data.length;
	    if ( audio.musicOn ) audio.click.play();

	  };

	  homeButton.onclick = e => {

	    controls.disabled = true;

	    gameSaved = true;
	    gameStarted = false;
	    audioButton.gameStarted = false;

	    start.innerHTML = gameSaved ? 'CONTINUE' : 'NEW GAME';

	    ui.classList.remove('in-game');
	    ui.classList.add('in-menu');

	    timer.stop();
	    animate.game( () => {}, 0, false );
	    animate.audioIn( audio );

	    animate.titleIn( () => {} );

	  };

	  controls.onSolved = function () {

	    controls.disabled = true;
	    
	    gameSaved = false;
	    gameStarted = false;
	    audioButton.gameStarted = false;

	    start.innerHTML = gameSaved ? 'CONTINUE' : 'NEW GAME';

	    ui.classList.remove('in-game');
	    ui.classList.add('in-menu');

	    console.log( timer.deltaTime );

	    timer.stop();
	    animate.game( () => {}, 0, false );
	    animate.audioIn( audio );

	    animate.titleOut( () => {

	      title.classList.remove( 'is-timer' );
	      animate.titleIn( timer.convert( timer.deltaTime ), () => {} );

	    } );

	  };

	  window.world = world;
	  window.cube = cube;
	  window.controls = controls;
	  window.timer = timer;
	  window.animate = animate;
	  window.audio = audio;

	}

	// export { Shatter } from './components/Shatter.js';

	exports.World = World;
	exports.Audio = Audio;
	exports.Cube = Cube;
	exports.Controls = Controls;
	exports.Scramble = Scramble;
	exports.Timer = Timer;
	exports.Animate = Animate;
	exports.SvgIcons = SvgIcons;
	exports.Init = Init;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
