const LocalStrategy = require( "passport-local" ).Strategy;
const bcrypt = require( "bcrypt" );

function initialize( passport ) {
  async function authenticateUser( req, username, password, done ) {
    const failMessage = "Authentication failed";
    const user = await req.models.User.findOne(
      {
        where: { username },
        raw  : true,
      }
    );
    if ( user == null )
      return done( null, false, { message: failMessage } );

    try {
      if ( await bcrypt.compare( password, user.password ) )
        return done( null, user );
      else
        return done( null, false, { message: failMessage } );
    } catch ( err ) {
      return done( err );
    }
  }

  passport.use( new LocalStrategy( {
    usernameField    : "username",
    passReqToCallback: true,
  }, authenticateUser ) );

  passport.serializeUser( ( user, done ) => done( null, user.id ) );
  passport.deserializeUser( async ( req, id, done ) => {
    const user = await req.models.User.findOne(
      {
        where: { id },
        raw  : true,
      }
    );
    return done( null, user );
  } );
}

function checkAuthenticated( req, res, next ) {
  if ( req.isAuthenticated() )
    return next();

  res.redirect( 302, "/login" );
}

function checkNotAuthenticated( req, res, next ) {
  if ( req.isAuthenticated() )
    return res.redirect( "/app" );

  next();
}

function returnAuthentication( req, res, next ) {
  if ( req.isAuthenticated() ) {
    res.locals.username = req.user.username;
    res.locals.userid = req.user.id;
    res.locals.isAuthorized = true;
  } else {
    res.locals.isAuthorized = false;
  }

  next();
}

module.exports = {
  initialize,
  checkAuthenticated,
  checkNotAuthenticated,
  returnAuthentication,
};