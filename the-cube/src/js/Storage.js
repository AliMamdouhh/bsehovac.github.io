class Storage {

  constructor( game ) {

    this.game = game;

    const gameVersion = '0.98';
    const userVersion = localStorage.getItem( 'theCube_version' );

    if ( ! userVersion || userVersion !== gameVersion ) {

      this.clearGame();
      this.clearPreferences();
      this.clearScores();
      localStorage.setItem( 'theCube_version', gameVersion );

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

      const gameInProgress = localStorage.getItem( 'theCube_playing' ) === 'true';

      if ( ! gameInProgress ) throw new Error();

      const gameCubeData = JSON.parse( localStorage.getItem( 'theCube_savedState' ) );
      const gameTime = parseInt( localStorage.getItem( 'theCube_time' ) );

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

    localStorage.setItem( 'theCube_playing', gameInProgress );
    localStorage.setItem( 'theCube_savedState', JSON.stringify( gameCubeData ) );
    localStorage.setItem( 'theCube_time', gameTime );

  }

  clearGame() {

    localStorage.removeItem( 'theCube_playing' );
    localStorage.removeItem( 'theCube_savedState' );
    localStorage.removeItem( 'theCube_time' );

  }

  // SCORE

  loadScores() {

    try {

      const scoresData = JSON.parse( localStorage.getItem( 'theCube_scoresData' ) );
      const scoresBest = parseInt( localStorage.getItem( 'theCube_scoresBest' ) );
      const scoresWorst = parseInt( localStorage.getItem( 'theCube_scoresWorst' ) );
      const scoresSolves = parseInt( localStorage.getItem( 'theCube_scoresSolves' ) );

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

    localStorage.setItem( 'theCube_scoresData', JSON.stringify( scoresData ) );
    localStorage.setItem( 'theCube_scoresBest', JSON.stringify( scoresBest ) );
    localStorage.setItem( 'theCube_scoresWorst', JSON.stringify( scoresWorst ) );
    localStorage.setItem( 'theCube_scoresSolves', JSON.stringify( scoresSolves ) );

  }

  clearScores() {

    localStorage.removeItem( 'theCube_scoresData' );
    localStorage.removeItem( 'theCube_scoresBest' );
    localStorage.removeItem( 'theCube_scoresWorst' );
    localStorage.removeItem( 'theCube_scoresSolves' );

  }

  // PREFERENCES

  loadPreferences() {

    try {

      const preferences = JSON.parse( localStorage.getItem( 'theCube_preferences' ) );

      if ( ! preferences ) throw new Error();

      this.game.controls.flipSpeed = preferences.flipSpeed;
      this.game.controls.flipBounce = preferences.flipBounce;
      this.game.scrambler.scrambleLength = preferences.scrambleLength;

      this.game.world.fov = parseFloat( preferences.fov );
      this.game.world.resize();

      this.game.cube.setTheme( preferences.theme );

      return true;

    } catch (e) {

      this.game.controls.flipSpeed = 350;
      this.game.controls.flipBounce = 2;
      this.game.scrambler.scrambleLength = 20;

      this.game.world.fov = 10;
      this.game.world.resize();

      this.game.cube.setTheme( 'cube' );

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
      theme: this.game.cube.theme,
    };

    localStorage.setItem( 'theCube_preferences', JSON.stringify( preferences ) );

  }

  clearPreferences() {

    localStorage.removeItem( 'theCube_preferences' );

  }

}

export { Storage };
