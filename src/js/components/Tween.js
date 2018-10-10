import { Animation } from './plugins/Animation.js';
import { Easing } from './Easing.js';

class Tween extends Animation {

  constructor( options ) {

    super( false );

    this.name = 'Tween';
    if ( options.name) this.name += ' : ' + options.name;

    this.duration = options.duration || 500;
    this.easing = options.easing || ( t => t );
    this.onUpdate = options.onUpdate || ( () => {} );
    this.onComplete = options.onComplete || ( () => {} );

    this.delay = options.delay || false;
    this.yoyo = options.yoyo ? false : null;

    this.time = 0;
    this.progress = 0;
    this.value = 0;
    this.delta = 0;

    this.getFromTo( options );

    if ( this.delay ) setTimeout( () => super.start() )
    else super.start();

    this.onUpdate( this );

  }

  update( delta ) {

    const old = this.value * 1;

    this.time += delta;

    this.progress = ( this.yoyo === true )
      ? 1 - ( this.time / this.duration )
      : this.time / this.duration;

    this.value = this.easing( this.progress );
    this.delta = this.value - old;

    if ( this.values !== null ) this.updateFromTo();

    if ( this.yoyo !== null ) this.updateYoyo();
    else if ( this.progress < 1 ) this.onUpdate( this );
    else {

      this.progress = 1;
      this.value = 1;
      this.onUpdate( this );
      this.onComplete( this );
      super.stop();

    } 

  }

  updateYoyo() {

    if ( this.progress >= 1 || this.progress <= 0 ) {

      this.value = this.progress = ( this.progress > 1 ) ? 1 : 0;
      this.yoyo = ! this.yoyo;
      this.time = 0;

    }

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

    Object.keys( this.to ).forEach( key => { this.values.push( key ) } );

  }

}

export { Tween, Easing };

window.tween = Tween;
window.easing = Easing;

/*

a = new tween( {
  duration: 2000,
  easing: easing.Elastic.Out(),
  onUpdate: tween => {
    console.log( tween.value );
  }, onComplete: () => {
    console.log( 'completed' );
  }
} );

*/