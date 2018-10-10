import { Tween, Easing } from './Tween.js';

class Transition {

  constructor( game ) {

    this.game = game;

    this.tweens = {};

    this.durations = {};

    this.data = {};
    
    this.initialized = false;

  }

  initialize() {

    this.data.cubeY = -0.2;
    this.data.cameraZoom = 0.85;

    this.game.controls.disable();

    this.game.cube.object.position.y = this.data.cubeY;
    this.game.controls.edges.position.y = this.data.cubeY;
    this.game.cube.animator.position.y = 4;
    this.game.cube.animator.rotation.x = - Math.PI / 3;
    // this.game.cube.shadow.material.opacity = 0;
    this.game.world.camera.zoom = this.data.cameraZoom;
    this.game.world.camera.updateProjectionMatrix();

    this.initialized = true;

  }

  cube( show ) {

    if ( typeof this.tweens.cube !== 'undefined' ) this.tweens.cube.stop();

    if ( show ) {

      if ( ! this.initialized ) this.initialize();

      this.tweens.cube = new Tween( {
        name: 'Show Cube',
        duration: 3000,
        easing: Easing.Elastic.Out( 0.5, 0.5 ),
        onUpdate: tween => {

          this.game.cube.animator.position.y = ( 1 - tween.value ) * 4;
          this.game.cube.animator.rotation.x = ( 1 - tween.value ) * - Math.PI / 3

        }
      } );

      if ( this.game.playing ) {

        setTimeout( () => this.timer( true ), 700 );

        setTimeout( () => {

          this.game.controls.enable();
          this.game.timer.start( true );

        }, 1500 );

      } else {

        setTimeout( () => this.title( true ), 700 );

      }

    } else {

      this.game.controls.disable();

      if ( this.game.playing ) {

        this.game.timer.stop();
        this.timer( false );

      } else {

        this.title( false );

      }

      this.tweens.cube = new Tween( {
        name: 'Hide Cube',
        duration: 2000,
        easing: Easing.Back.Out( 0.5 ),
        onUpdate: tween => {

          this.game.cube.animator.position.y = tween.value * 4;
          this.game.cube.animator.rotation.x = tween.value * Math.PI / 3

        }
      } );

    }

  }

  float() {

    if ( typeof this.tweens.float !== 'undefined' ) this.tweens.float.stop();

    this.tweens.float = new Tween( {
      name: 'Float Cube',
      duration: 1500,
      easing: Easing.Sine.InOut(),
      yoyo: true,
      onUpdate: tween => {

        this.game.cube.holder.position.y = - 0.02 + tween.value * 0.04;
        this.game.cube.holder.rotation.x = 0.005 - tween.value * 0.01;
        this.game.cube.holder.rotation.z = - this.game.cube.holder.rotation.x;
        this.game.cube.holder.rotation.y = this.game.cube.holder.rotation.x;

      },
    } );

  }

  zoom( game, time, callback ) {

    const zoom = ( game ) ? 1 : this.data.cameraZoom;
    const cubeY = ( game ) ? -0.3 : this.data.cubeY;
    const duration = ( time > 0 ) ? Math.max( time, 1500 ) : 1500;
    const rotations = ( time > 0 ) ? Math.round( duration / 1500 ) : 1;
    const easing = Easing.Power.InOut( ( time > 0 ) ? 2 : 3 );

    this.tweens.zoom = new Tween( {
      name: 'Zooming Cube',
      target: this.game.world.camera,
      duration: duration,
      easing: easing,
      to: { zoom: zoom },
      onUpdate: () => { this.game.world.camera.updateProjectionMatrix(); },
    } );

    this.tweens.rotate = new Tween( {
      name: 'Rotating Cube',
      target: this.game.cube.animator.rotation,
      duration: duration,
      easing: easing,
      to: { y: - Math.PI * 2 * rotations },
      onComplete: () => { this.game.cube.animator.rotation.y = 0; callback(); },
    } );

    // this.tweens.cubeY = new Tween( {
    //   target: this.data,
    //   duration: duration,
    //   easing: easing,
    //   to: { cubeY: ( game ) ? -0.3 : -0.2 },
    //   onUpdate: () => {

    //     this.game.cube.object.position.y = this.data.cubeY;
    //     this.game.controls.edges.position.y = this.data.cubeY;

    //   },
    // } );

  }

  preferences( show ) {

    if ( typeof this.tweens.range === 'undefined' ) this.tweens.range = [];  
    else this.tweens.range.forEach( tween => { tween.stop(); tween = null; } )

    let tweenId = -1;
    let listMax = 0;

    const ranges = this.game.dom.prefs.querySelectorAll( '.range' );
    const easing = show ? Easing.Power.Out(2) : Easing.Power.Out(1);

    ranges.forEach( ( range, rangeIndex ) => {

      const label = range.querySelector( '.range__label' );
      const track = range.querySelector( '.range__track-line' );
      const handle = range.querySelector( '.range__handle' );
      const list = range.querySelectorAll( '.range__list div' );

      const delay = rangeIndex * 100;

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

  }

  title( show ) {

    const title = this.game.dom.title;

    if ( title.querySelector( 'span i' ) === null )
      title.querySelectorAll( 'span' ).forEach( span => this.splitLetters( span ) );

    const letters = title.querySelectorAll( 'i' );

    this.flipLetters( 'title', letters, show );

    title.style.opacity = 1;

    const note = this.game.dom.note;

    this.tweens.title[ letters.length ] = new Tween( {
      name: 'Blinking text',
      target: note.style,
      easing: Easing.Sine.InOut(),
      duration: show ? 800 : 400,
      yoyo: show ? true : null,
      from: { opacity: show ? 0 : ( parseFloat( getComputedStyle( note ).opacity ) ) },
      to: { opacity: show ? 1 : 0 },
    } );

  }

  timer( show ) {

    const timer = this.game.dom.timer;

    timer.style.opacity = 0;

    this.game.timer.setText();

    this.splitLetters( timer );

    const letters = timer.querySelectorAll( 'i' );

    this.flipLetters( 'timer', letters, show );

    timer.style.opacity = 1;

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

    if ( typeof this.tweens[ type ] === 'undefined' ) this.tweens[ type ] = [];  
    else this.tweens[ type ].forEach( tween => { tween.stop(); tween = null; } )

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

export { Transition };
