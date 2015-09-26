"use strict";
var app = angular.module('App', ['angular-loading-bar', 'ngAnimate', 'ngRoute', 'ui.bootstrap', 'angularMoment', 'ngCookies'])
  .directive('passwordCheck', [function () {
        return {
          restrict: 'A',
          scope: true,
          require: 'ngModel',
          link: function (scope, elem , attributes, control) {
            var checker = function () {
              var password1 = scope.$eval(attributes.ngModel);
              var password2 = scope.$eval(attributes.passwordCheck);
              return password1 == password2;
            };
            scope.$watch(checker, function (n) {
              control.$setValidity("unique", n);
            });
          }
        }
      }
    ]).factory('Auth', function($cookies) {
      return {
        isLoggedIn : function() {
          return $cookies['logged_in'];
        },
        login : function() {
          $cookie['logged_in']
        }
      }
    });

app.controller('NavbarController', function($scope, $location, Auth) {
  $scope.isLoggedIn = function() {
    return Auth.isLoggedIn();
  };

  $scope.isActive = function(url) {
    return $location.path() === url;
  };

  $('.navbar-nav li a').click(function() {
    if ($('.navbar-collapse.collapse').hasClass('in')) {
      $('#navbar').collapse('hide');
    }
  });
});

app.controller('GamesController', function($scope, $http) {
  $http.get('/api/games')
    .success(function(games) {
      $scope.games = games;
    })
    .error(function(err, status) {
      $scope.error = {message: err, status: status};
    });
});

app.controller('ServersController', function($scope, $http, $interval) {
  $scope.state = {
    loading: true
  };
  $scope.refresh = function() {
    $http.get('/api/servers')
      .success(function(servers) {
        $scope.servers = servers;
        $scope.state.loading = false;
      })
      .error(function(err, status) {
        $scope.error = {message: err, status: status};
        $scope.state.loading = false;
      });
  };
  $scope.isEmpty = function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  };
  $scope.refresh();
  $scope.intervalPromise = $interval(function() {
    $scope.refresh();
  }, 10000);
  $scope.$on('$destroy', function() {
    $interval.cancel($scope.intervalPromise);
  });
});

app.controller('UsersController', function($scope, $http) {
  $scope.pcUsers = [];
  $scope.consoleUsers = [];
  $http.get('/api/users')
    .success(function(data) {
      $scope.data = data;
      $scope.data.forEach(function(user) {
        if (user.type === "pc") {
          $scope.pcUsers.push(user);
        } else if (user.type === "console"){
          $scope.consoleUsers.push(user);
        }
      });
    })
    .error(function(err, status) {
      $scope.error = {message: err, status: status};
    });
  $http.get('/api/users/max/pc')
    .success(function(max) {
      $scope.maxPc = max;
    })
    .error(function(err, status) {
      $scope.error = {message: err, status: status};
    });
  $http.get('/api/users/max/console')
    .success(function(max) {
      $scope.maxConsole = max;
    })
    .error(function(err, status) {
      $scope.error = {message: err, status: status};
    });
});

app.controller('VerifyController', function($scope, $http, $routeParams) {
  var token = $routeParams.token;
  console.log(token);
  $http.get('/api/verify/' + token)
    .success(function(data, status) {
      if (data.first) {
        $scope.message = "Votre compte a bien été créé ! Vous pouvez maintenant vous connecter.";
      } else if (data.first === false) {
        $scope.message = "Votre compte a déjà été créé ! Vous pouvez vous connecter.";
      } else {
        $scope.error = "Une erreur est survenue lors de la confirmation de votre compte. Veuillez contacter info@lanmomo.org !"
      }
    })
    .error(function(data) {
      $scope.error = "Une erreur est survenue lors de la confirmation de votre compte. Veuillez contacter info@lanmomo.org !"
    });
});

app.controller('LoginController', function ($scope, $http, $location) {
  $scope.submitLogin = function () {
    var data = {
        email: $scope.user.email,
        password: $scope.user.password
    }
    $http.post('/api/login', data)
      .success(function(data) {
        $location.path('/');
      })
      .error(function(err, status) {
        $scope.error = {message: err.error, status: status};
      });
  };
});

app.controller('LogoutController', function ($scope, $http, $location) {
  $http.get('/api/logout')
    .success(function(data) {
      $location.path('/');
    })
    .error(function(err, status) {
      $scope.error = {message: err.error, status: status};
    });
});

app.controller('HomeController', function ($rootScope, $http) {
  $http.get('/api/login')
    .success(function(data) {
      $rootScope.loggedIn = data.logged_in;
    })
    .error(function(err, status) {
      $rootScope.loggedIn = false;
    });
});

app.controller('ProfileController', function ($scope, $http) {
  $http.get('/api/profile')
    .success(function(data) {
      $scope.userData = data.user;
    })
    .error(function(err, status) {
      $scope.error = {message: err.error, status: status};
    });
});

app.controller('SignupController', function($scope, $http) {
  $('[data-toggle="tooltip"]').tooltip();
  $scope.state = {
    submitted: false,
    loading: false,
    success: false,
    error: false,
    usernameChanged: false,
    emailChanged: false,
    usernameAvailable: false,
    emailAvailable: false
  };
  $scope.signup = function(data) {
    $scope.state.loading = true;
    $scope.state.submitted = true;
    $http.post('/api/users', data)
      .success(function(res, status) {
        $scope.message = res.message;
        $scope.state.loading = false;
        $scope.state.success = true;
      })
      .error(function(data) {
        $scope.message = 'Malheuresement, une erreur est survenue lors de votre inscription !' +
          ' Veuillez réessayer plus tard et contacter info@lanmomo.org si le problème persiste.';
        $scope.state.loading = false;
        $scope.state.error = true;
      });
  };
  $scope.isUsernameAvailable = function(user) {
    $http.post('/api/users/has/username', {username: user.username})
      .success(function(data) {
        $scope.state.usernameAvailable = !data.exists;
        $scope.state.usernameChanged = true;
      })
      .error(function(data) {
        $scope.state.usernameAvailable = false;
        $scope.state.usernameChanged = true;
      });
  };
  $scope.resetUsernameChanged = function() {
    $scope.state.usernameChanged = false;
  };
  $scope.isEmailAvailable = function(user) {
    $http.post('/api/users/has/email', {email: user.email})
      .success(function(data) {
        $scope.state.emailAvailable = !data.exists;
        $scope.state.emailChanged = true;
      })
      .error(function(data) {
        console.log(data);
        $scope.state.emailAvailable = false;
        $scope.state.emailChanged = true;
      });
  };
  $scope.resetEmailChanged = function() {
    $scope.state.emailChanged = false;
  };
});

app.config(function($routeProvider, $locationProvider, cfpLoadingBarProvider) {
  $routeProvider.when('/', {
    templateUrl: 'partials/home.html',
    controller: 'HomeController'
  })
  .when('/users', {
    templateUrl: 'partials/users.html',
    controller: 'UsersController'
  })
  .when('/games', {
    templateUrl: 'partials/games.html',
    controller: 'GamesController'
  })
  .when('/servers', {
    templateUrl: 'partials/servers.html',
    controller: 'ServersController'
  })
  .when('/about', {
    templateUrl: 'partials/about.html'
  })
  .when('/terms', {
    templateUrl: 'partials/terms.html'
  })
  .when('/faq', {
    templateUrl: 'partials/faq.html'
  })
  .when('/contact', {
    templateUrl: 'partials/contact.html'
  })
  .when('/signup', {
    templateUrl: 'partials/signup.html',
    controller: 'SignupController'
  })
  .when('/profile', {
    templateUrl: 'partials/profile.html',
    controller: 'ProfileController'
  })
  .when('/login', {
    templateUrl: 'partials/login.html',
    controller: 'LoginController'
  })
  .when('/logout', {
    templateUrl: 'partials/home.html',
    controller: 'LogoutController'
  })
  .when('/verify/:token', {
    templateUrl: 'partials/verify.html',
    controller: 'VerifyController'
  });
  $routeProvider.otherwise({redirectTo: '/'});

  $locationProvider.html5Mode(true);

  cfpLoadingBarProvider.includeSpinner = false;

  moment.locale('fr');
});

app.filter('capitalize', function() {
  return function(input) {
    return input.substring(0, 1).toUpperCase() + input.substring(1);
  };
});
