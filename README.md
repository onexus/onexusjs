## Run the tests

Install [Node.js](http://nodejs.org/), then inside a console:
```
npm update # Installs all Grunt dependencies (package.json) inside node_modules directory
bower update # Installs all ui-select dependencies (bower.json) inside bower_components directory
```

Development:
```
grunt build # Builds dist/onexus.js
grunt test # Launches Karma
grunt server # Runs a development local web server
```