// for convenience
var loginButtonsSession = Accounts._loginButtonsSession;

// events shared between loginButtonsLoggedOutDropdown and
// loginButtonsLoggedInDropdown
Template.loginButtons.events({
  'click #login-name-link, click #login-sign-in-link': function () {
    loginButtonsSession.set('dropdownVisible', true);
    Deps.flush();
    correctDropdownZIndexes();
  },
  'click .login-close-text': function () {
    loginButtonsSession.closeDropdown();
  }
});


//
// loginButtonsLoggedInDropdown template and related
//

Template._loginButtonsLoggedInDropdown.events({
  'click #login-buttons-open-change-password': function() {
    loginButtonsSession.resetMessages();
    loginButtonsSession.set('inChangePasswordFlow', true);
  }
});

Template._loginButtonsLoggedInDropdown.helpers({

	"displayName": displayName,

	"inChangePasswordFlow": function () {
    return loginButtonsSession.get('inChangePasswordFlow');
  },

	"inMessageOnlyFlow": function () {
    return loginButtonsSession.get('inMessageOnlyFlow');
  },

	"dropdownVisible": function () {
    return loginButtonsSession.get('dropdownVisible');
  },

	"allowChangingPassword": function () {
    // it would be more correct to check whether the user has a password set,
    // but in order to do that we'd have to send more data down to the client,
    // and it'd be preferable not to send down the entire service.password document.
    //
    // instead we use the heuristic: if the user has a username or email set.
    var user = Meteor.user();
    return user.username || (user.emails && user.emails[0] && user.emails[0].address);
  },
});


//
// loginButtonsLoggedOutDropdown template and related
//

var loginEvents = {  // AGS: used to be Template._loginButtonsLoggedOutDropdown.events(...)
  'click #login-buttons-password': function () {
    // AGS: changed meaning of this id to ONLY sign in
    login();
  },
  'click #signup-buttons-password': function () {
    // AGS: added this id for the create accounts button
    signup();
  },

  'keypress #forgot-password-email': function (event) {
    if (event.keyCode === 13)
      forgotPassword();
  },

  'click #login-buttons-forgot-password': function () {
    forgotPassword();
  },

  'click #signup-link': function () {
    loginButtonsSession.resetMessages();

    // store values of fields before swtiching to the signup form
    var username = trimmedElementValueById('login-username');
    var email = trimmedElementValueById('login-email');
    var usernameOrEmail = trimmedElementValueById('login-username-or-email');
    // notably not trimmed. a password could (?) start or end with a space
    var password = elementValueById('login-password');

    loginButtonsSession.set('inSignupFlow', true);
    loginButtonsSession.set('inForgotPasswordFlow', false);
    // force the ui to update so that we have the approprate fields to fill in
    Deps.flush();

    // update new fields with appropriate defaults
    if (username !== null)
      document.getElementById('login-username').value = username;
    else if (email !== null)
      document.getElementById('login-email').value = email;
    else if (usernameOrEmail !== null)
      if (usernameOrEmail.indexOf('@') === -1)
        document.getElementById('login-username').value = usernameOrEmail;
    else
      document.getElementById('login-email').value = usernameOrEmail;

    if (password !== null)
      document.getElementById('login-password').value = password;

    // Force redrawing the `login-dropdown-list` element because of
    // a bizarre Chrome bug in which part of the DIV is not redrawn
    // in case you had tried to unsuccessfully log in before
    // switching to the signup form.
    //
    // Found tip on how to force a redraw on
    // http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes/3485654#3485654
    var redraw = document.getElementById('login-dropdown-list');
    redraw.style.display = 'none';
    redraw.offsetHeight; // it seems that this line does nothing but is necessary for the redraw to work
    redraw.style.display = 'block';
  },
  'click #forgot-password-link': function () {
    loginButtonsSession.resetMessages();

    // store values of fields before swtiching to the signup form
    var email = trimmedElementValueById('login-email');
    var usernameOrEmail = trimmedElementValueById('login-username-or-email');

    loginButtonsSession.set('inSignupFlow', false);
    loginButtonsSession.set('inForgotPasswordFlow', true);
    // force the ui to update so that we have the approprate fields to fill in
    Deps.flush();

    // update new fields with appropriate defaults
    if (email !== null)
      document.getElementById('forgot-password-email').value = email;
    else if (usernameOrEmail !== null)
      if (usernameOrEmail.indexOf('@') !== -1)
        document.getElementById('forgot-password-email').value = usernameOrEmail;

  },
  'click #back-to-login-link': function () {
    loginButtonsSession.resetMessages();

    var username = trimmedElementValueById('login-username');
    var email = trimmedElementValueById('login-email')
          || trimmedElementValueById('forgot-password-email'); // Ughh. Standardize on names?
    // notably not trimmed. a password could (?) start or end with a space
    var password = elementValueById('login-password');

    loginButtonsSession.set('inSignupFlow', false);
    loginButtonsSession.set('inForgotPasswordFlow', false);
    // force the ui to update so that we have the approprate fields to fill in
    Deps.flush();

    if (document.getElementById('login-username'))
      document.getElementById('login-username').value = username;
    if (document.getElementById('login-email'))
      document.getElementById('login-email').value = email;

    if (document.getElementById('login-username-or-email'))
      document.getElementById('login-username-or-email').value = email || username;

    if (password !== null)
      document.getElementById('login-password').value = password;
  },
  'keypress #login-username, keypress #login-email, keypress #login-username-or-email, keypress #login-password, keypress #login-password-again': function (event) {
    if (event.keyCode === 13)
      login();   // AGS: default to login
  },
  'keypress #login-email-again': function (event) {
    if (event.keyCode === 13)
      signup();   // AGS: new field which is only present for signup, so default to that
  }

};

Template._loginButtonsLoggedOutDropdown.events = loginEvents; // AGS
Template.loginSection.events = loginEvents; // AGS

// additional classes that can be helpful in styling the dropdown
Template._loginButtonsLoggedOutDropdown.helpers({
  "additionalClasses": function () {
    if (!hasPasswordService()) {
      return false;
    } else {
      if (loginButtonsSession.get('inSignupFlow')) {
        return 'login-form-create-account';
      } else if (loginButtonsSession.get('inForgotPasswordFlow')) {
        return 'login-form-forgot-password';
      } else {
        return 'login-form-sign-in';
      }
    }
  },

  "dropdownVisible": function () {
    return loginButtonsSession.get('dropdownVisible');
  },

  "hasPasswordService": hasPasswordService,
});

// return all login services, with password last
Template._loginButtonsLoggedOutAllServices.helpers({
  "services": getLoginServices,
  "isPasswordService": function () {
    return this.name === 'password';
  },
  "hasOtherServices": function () {
    return getLoginServices().length > 1;
  },
  "hasPasswordService":   hasPasswordService,
});

Template._loginButtonsLoggedOutPasswordService.helpers({

  "fields": function () {
    var loginFields = [
      {fieldName: 'username-or-email', fieldLabel: 'Username or Email',
       visible: function () {
         return _.contains(
           ["USERNAME_AND_EMAIL", "USERNAME_AND_OPTIONAL_EMAIL"],
           passwordSignupFields());
       }},
      {fieldName: 'username', fieldLabel: 'Username',
       visible: function () {
         return passwordSignupFields() === "USERNAME_ONLY";
       }},
      {fieldName: 'email', fieldLabel: 'Email', inputType: 'email',
       visible: function () {
         return passwordSignupFields() === "EMAIL_ONLY";
       }},
      {fieldName: 'password', fieldLabel: 'Password', inputType: 'password',
       visible: function () {
         return true;
       }}
    ];

    var signupFields = [
      {fieldName: 'username', fieldLabel: 'Username',
       visible: function () {
         return _.contains(
           ["USERNAME_AND_EMAIL", "USERNAME_AND_OPTIONAL_EMAIL", "USERNAME_ONLY"],
           passwordSignupFields());
       }},
      {fieldName: 'email', fieldLabel: 'Email', inputType: 'email',
       visible: function () {
         return _.contains(
           ["USERNAME_AND_EMAIL", "EMAIL_ONLY"],
           passwordSignupFields());
       }},
      {fieldName: 'email-again', fieldLabel: 'Please retype your email', inputType: 'email',  // Added by AGS
       visible: function () {
         return (passwordSignupFields() === "EMAIL_ONLY");
       }},
      {fieldName: 'email', fieldLabel: 'Email (optional)', inputType: 'email',
       visible: function () {
         return passwordSignupFields() === "USERNAME_AND_OPTIONAL_EMAIL";
       }},
      {fieldName: 'password', fieldLabel: 'Password', inputType: 'password',
       visible: function () {
         return true;
       }},
      {fieldName: 'password-again', fieldLabel: 'Password (again)',
       inputType: 'password',
       visible: function () {
         // No need to make users double-enter their password if
         // they'll necessarily have an email set, since they can use
         // the "forgot password" flow.
         return _.contains(
           ["USERNAME_AND_OPTIONAL_EMAIL", "USERNAME_ONLY"],
           passwordSignupFields());
       }}
    ];

    return loginButtonsSession.get('inSignupFlow') ? signupFields : loginFields;
  },

  "inForgotPasswordFlow": function () {
    return loginButtonsSession.get('inForgotPasswordFlow');
  },

  "inLoginFlow": function () {
    return !loginButtonsSession.get('inSignupFlow') && !loginButtonsSession.get('inForgotPasswordFlow');
  },

  "inSignupFlow": function () {
    return loginButtonsSession.get('inSignupFlow');
  },

  "showCreateAccountLink": function () {
    return !Accounts._options.forbidClientAccountCreation;
  },

  "showForgotPasswordLink": function () {
    return _.contains(
      ["USERNAME_AND_EMAIL", "USERNAME_AND_OPTIONAL_EMAIL", "EMAIL_ONLY"],
      passwordSignupFields());
  },

});

Template._loginButtonsFormField.helpers({
  "inputType": function () {
    return this.inputType || "text";
  }
});


//
// loginButtonsChangePassword template
//

Template._loginButtonsChangePassword.events({
  'keypress #login-old-password, keypress #login-password, keypress #login-password-again': function (event) {
    if (event.keyCode === 13)
      changePassword();
  },
  'click #login-buttons-do-change-password': function () {
    changePassword();
  }
});

Template._loginButtonsChangePassword.helpers({
  "fields": function () {
    return [
      {fieldName: 'old-password', fieldLabel: 'Current Password', inputType: 'password',
       visible: function () {
         return true;
       }},
      {fieldName: 'password', fieldLabel: 'New Password', inputType: 'password',
       visible: function () {
         return true;
       }},
      {fieldName: 'password-again', fieldLabel: 'New Password (again)',
       inputType: 'password',
       visible: function () {
         // No need to make users double-enter their password if
         // they'll necessarily have an email set, since they can use
         // the "forgot password" flow.
         return _.contains(
           ["USERNAME_AND_OPTIONAL_EMAIL", "USERNAME_ONLY"],
           passwordSignupFields());
       }}
    ];
  },
});


//
// helpers
//

var elementValueById = function(id) {
  var element = document.getElementById(id);
  if (!element)
    return null;
  else
    return element.value;
};

var trimmedElementValueById = function(id) {
  var element = document.getElementById(id);
  if (!element)
    return null;
  else
    return element.value.replace(/^\s*|\s*$/g, ''); // trim() doesn't work on IE8;
};

var loginOrSignup = function () {
  if (loginButtonsSession.get('inSignupFlow'))
    signup();
  else
    login();
};

// setSignupFlow - added by AGS
var setSignupFlow = function(signupFlow) {
  var wasInSignupFlow = loginButtonsSession.get('inSignupFlow');

  var username = trimmedElementValueById('login-username');
  var email = trimmedElementValueById('login-email');
  var emailAgain = trimmedElementValueById('login-email-again') || '';
  // notably not trimmed. a password could (?) start or end with a space
  var password = elementValueById('login-password');
  loginButtonsSession.set('inSignupFlow', signupFlow);
  // force the ui to update so that we have the approprate fields to fill in
  Deps.flush();
  if (document.getElementById('login-username'))
    document.getElementById('login-username').value = username;
  if (document.getElementById('login-email'))
    document.getElementById('login-email').value = email;
  if (!wasInSignupFlow && signupFlow) {
    if (document.getElementById('login-email-again')) {
      // animate the new field to make it clear what's different
      $('#login-email-again-label-and-input').hide();
      $('#login-email-again-label-and-input').slideDown();
      document.getElementById('login-email-again').value = emailAgain;
      if (email) {
        $('#login-email-again').focus();
      } else {
        $('#login-email').focus();
      }
    }
  }
  if (document.getElementById('login-username-or-email'))
    document.getElementById('login-username-or-email').value = email || username;
  if (password !== null)
    document.getElementById('login-password').value = password;
}

var login = function () {
  loginButtonsSession.resetMessages();

  setSignupFlow(false); // added by AGS to hide the email-again field, if nec.

  var username = trimmedElementValueById('login-username');
  var email = trimmedElementValueById('login-email').toLowerCase();  // LOWERCASE conversion added by AGS
  var usernameOrEmail = trimmedElementValueById('login-username-or-email');
  // notably not trimmed. a password could (?) start or end with a space
  var password = elementValueById('login-password');

  var loginSelector;
  if (username !== null) {
    if (!validateUsername(username))
      return;
    else
      loginSelector = {username: username};
  } else if (email !== null) {
    if (!validateEmail(email))
      return;
    else
      loginSelector = {email: email};
  } else if (usernameOrEmail !== null) {
    // XXX not sure how we should validate this. but this seems good enough (for now),
    // since an email must have at least 3 characters anyways
    if (!validateUsername(usernameOrEmail))
      return;
    else
      loginSelector = usernameOrEmail;
  } else {
    throw new Error("Unexpected -- no element to use as a login user selector");
  }

  Meteor.loginWithPassword(loginSelector, password, function (error, result) {
    if (error) {
      loginButtonsSession.errorMessage(error.reason || "Unknown error");
    } else {
      loginButtonsSession.closeDropdown();
    }
  });
};


var signup = function () {
  loginButtonsSession.resetMessages();

  var wasInSignupFlow = loginButtonsSession.get("inSignupFlow");
  setSignupFlow(true); // added by AGS to display the email-again field

  var options = {}; // to be passed to Accounts.createUser

  var username = trimmedElementValueById('login-username');
  if (username !== null) {
    if (!validateUsername(username))
      return;
    else
      options.username = username;
  }

  var email = trimmedElementValueById('login-email').toLowerCase();  // LOWERCASE conversion added by AGS
  var password = elementValueById('login-password');

  if (email === '' && password === '' && wasInSignupFlow) {
    // pressing ok with empty fields returns to login view
    setSignupFlow(false);
    return;
  }

  if (email !== null) {
    if (!validateEmail(email))
      return;
    else
      options.email = email;
  }

  // notably not trimmed. a password could (?) start or end with a space
  if (!validatePassword(password))
    return;
  else
    options.password = password;

  if (!matchPasswordAgainIfPresent())
    return;

  if (!wasInSignupFlow) return;  // AGS - if you weren't inSignupFlow before, then no email-again, so don't show email mismatch error

  if (!matchEmailAgainIfPresent())  // AGS added
    return;

  Accounts.createUser(options, function (error) {
    if (error) {
      if (error.reason==="Email already exists.") {
        loginButtonsSession.errorMessage("A user with that email address has already joined - please press 'Log in' instead.");
        setSignupFlow(false);
      } else {
        loginButtonsSession.errorMessage(error.reason || "Unknown error");
      }
    } else {
      loginButtonsSession.closeDropdown();
    }
  });
};

var forgotPassword = function () {
  loginButtonsSession.resetMessages();

  var email = trimmedElementValueById("forgot-password-email");
  if (email.indexOf('@') !== -1) {
    Accounts.forgotPassword({email: email}, function (error) {
      if (error)
        loginButtonsSession.errorMessage(error.reason || "Unknown error");
      else
        loginButtonsSession.infoMessage("Email sent");
    });
  } else {
    loginButtonsSession.errorMessage("Invalid email");
  }
};

var changePassword = function () {
  loginButtonsSession.resetMessages();

  // notably not trimmed. a password could (?) start or end with a space
  var oldPassword = elementValueById('login-old-password');

  // notably not trimmed. a password could (?) start or end with a space
  var password = elementValueById('login-password');
  if (!validatePassword(password))
    return;

  if (!matchPasswordAgainIfPresent())
    return;

  Accounts.changePassword(oldPassword, password, function (error) {
    if (error) {
      loginButtonsSession.errorMessage(error.reason || "Unknown error");
    } else {
      loginButtonsSession.set('inChangePasswordFlow', false);
      loginButtonsSession.set('inMessageOnlyFlow', true);
      loginButtonsSession.infoMessage("Password changed");
    }
  });
};

var matchEmailAgainIfPresent = function () {
  var emailAgain = trimmedElementValueById('login-email-again').toLowerCase();
  if (emailAgain !== null) {
    var email = trimmedElementValueById('login-email').toLowerCase();
    if (email !== emailAgain) {
      loginButtonsSession.errorMessage("Please check your email address - the two above don't match!");
      return false;
    }
  }
  return true;
};

var matchPasswordAgainIfPresent = function () {
  // notably not trimmed. a password could (?) start or end with a space
  var passwordAgain = elementValueById('login-password-again');
  if (passwordAgain !== null) {
    // notably not trimmed. a password could (?) start or end with a space
    var password = elementValueById('login-password');
    if (password !== passwordAgain) {
      loginButtonsSession.errorMessage("Passwords don't match");
      return false;
    }
  }
  return true;
};

var correctDropdownZIndexes = function () {
  // IE <= 7 has a z-index bug that means we can't just give the
  // dropdown a z-index and expect it to stack above the rest of
  // the page even if nothing else has a z-index.  The nature of
  // the bug is that all positioned elements are considered to
  // have z-index:0 (not auto) and therefore start new stacking
  // contexts, with ties broken by page order.
  //
  // The fix, then is to give z-index:1 to all ancestors
  // of the dropdown having z-index:0.
  for(var n = document.getElementById('login-dropdown-list').parentNode;
      n.nodeName !== 'BODY';
      n = n.parentNode)
    if (n.style.zIndex === 0)
      n.style.zIndex = 1;
};
