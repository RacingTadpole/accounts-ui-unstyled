// for convenience
var loginButtonsSession = Accounts._loginButtonsSession;

// shared between dropdown and single mode
Template.loginButtons.events({
  'click #login-buttons-logout': function() {
    Meteor.logout(function () {
      loginButtonsSession.closeDropdown();
    });
  }
});

UI.registerHelper('loginButtons', function () {
  throw new Error("Use {{> loginButtons}} instead of {{loginButtons}}");
});

//
// helpers
//

displayName = function () {
  var user = Meteor.user();
  if (!user)
    return '';

  // Mod by AGS - put email as first choice (was last choice)
  if (user.emails && user.emails[0] && user.emails[0].address)
    return user.emails[0].address;
  if (user.profile && user.profile.name)
    return user.profile.name;
  if (user.username)
    return user.username;

  return '';
};

// returns an array of the login services used by this app. each
// element of the array is an object (eg {name: 'facebook'}), since
// that makes it useful in combination with handlebars {{#each}}.
//
// don't cache the output of this function: if called during startup (before
// oauth packages load) it might not include them all.
//
// NOTE: It is very important to have this return password last
// because of the way we render the different providers in
// login_buttons_dropdown.html
getLoginServices = function () {
  var self = this;

  // First look for OAuth services.
  var services = Package['accounts-oauth'] ? Accounts.oauth.serviceNames() : [];

  // Be equally kind to all login services. This also preserves
  // backwards-compatibility. (But maybe order should be
  // configurable?)
  services.sort();

  // Add password, if it's there; it must come last.
  if (hasPasswordService())
    services.push('password');

  return _.map(services, function(name) {
    return {name: name};
  });
};

hasPasswordService = function () {
  return !!Package['accounts-password'];
};

dropdown = function () {
  return hasPasswordService() || getLoginServices().length > 1;
};

// XXX improve these. should this be in accounts-password instead?
//
// XXX these will become configurable, and will be validated on
// the server as well.
validateUsername = function (username) {
  if (username.length >= 3) {
    return true;
  } else {
    loginButtonsSession.errorMessage("Username must be at least 3 characters long");
    return false;
  }
};
validateEmail = function (email) {
  if (passwordSignupFields() === "USERNAME_AND_OPTIONAL_EMAIL" && email === '')
    return true;

  if (email.indexOf('@') !== -1) {
    return true;
  } else {
    loginButtonsSession.errorMessage("Invalid email");
    return false;
  }
};
validatePassword = function (password) {
  if (password.length >= 6) {
    return true;
  } else {
    loginButtonsSession.errorMessage("Password must be at least 6 characters long");
    return false;
  }
};

//
// loginButtonLoggedOut template
//

Template._loginButtonsLoggedOut.dropdown = dropdown;

Template._loginButtonsLoggedOut.services = getLoginServices;

Template._loginButtonsLoggedOut.singleService = function () {
  var services = getLoginServices();
  if (services.length !== 1)
    throw new Error(
      "Shouldn't be rendering this template with more than one configured service");
  return services[0];
};

Template._loginButtonsLoggedOut.configurationLoaded = function () {
  return Accounts.loginServicesConfigured();
};


//
// loginButtonsLoggedIn template
//

// decide whether we should show a dropdown rather than a row of
// buttons
Template._loginButtonsLoggedIn.dropdown = dropdown;



//
// loginButtonsLoggedInSingleLogoutButton template
//

Template._loginButtonsLoggedInSingleLogoutButton.displayName = displayName;



//
// loginButtonsMessage template
//

Template._loginButtonsMessages.errorMessage = function () {
  if (loginButtonsSession.get('errorMessage')=='User not found') {
    return 'User not found. If this is your first time here, please press "New user", or sign in with Google above.'
  }
  return loginButtonsSession.get('errorMessage');
};

Template._loginButtonsMessages.infoMessage = function () {
  return loginButtonsSession.get('infoMessage');
};


//
// loginButtonsLoggingInPadding template
//

Template._loginButtonsLoggingInPadding.dropdown = dropdown;

//
// added by AGS
//
Template.loginSection.configurationLoaded = function () {
  return Accounts.loginServicesConfigured();
};

// return all login services, with password last
Template.loginSection.services = getLoginServices;

Template.loginSection.isPasswordService = function () {
  return this.name === 'password';
};

Template.loginSection.hasOtherServices = function () {
  return getLoginServices().length > 1;
};

Template.loginSection.hasPasswordService = hasPasswordService;

