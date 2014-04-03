var bower = require('bower');

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.initConfig({

    clean: {
      dist: ['dist/']
    },

    concat: {
      dist: {
        src: [
          'src/onexus.js'
        ],
        dest: 'dist/onexus.js'
      }
    },

    connect: {
		server: {
		  options: {
		    port: 9001,
		    keepalive: true
		  }
		}
    }

  });

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', ['clean', 'concat']);
  grunt.registerTask('server', ['connect:server']);

};