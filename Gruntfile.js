'use strict';
var LIVERELOAD_PORT = 35729;
var SERVER_PORT = 8000;

var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
    return connect.static(
        require('path').resolve(dir),
        {
            // We need to specify a file that will be displayed in place of
            // index.html. _.html is used because it is unlikely to exist.
            index: '_.html'
        }
    );
};
var mountDirectory = function(connect, dir) {
    return connect.directory(
        require('path').resolve(dir),
        {
            icons: true,
        }
    );
};

var postHandler = function(req, res, next) {
    if (req.method === 'POST') {
        //debugger;

        console.log('received a POST request');

        var mkdirp = require('mkdirp');
        var fs = require('fs');
        //var Buffer = require('buffer/').Buffer;

        // We don't want the leading /, or else the file system will think
        // we're writing to root, which we don't have permission to. Should
        // really be dealing with the path more gracefully.
        var path = req.url.substring(1);

        // First make sure the directory exists, or else the following call to
        // createWriteStream fails. We don't want to include the file name as
        // part of the directory, or else our post will be trying to change the
        // directory to become a file with content, which will fail.
        var lastDelimiter = path.lastIndexOf('/');
        if (lastDelimiter >= 0) {
            var directories = path.substring(0, lastDelimiter);
            mkdirp.sync(directories);
        }

		var file;
        if (req.headers['content-type'] === 'application/octet-stream') {
            var base64 = require('base64-stream');

            file = fs.createWriteStream(path);
            req.pipe(base64.decode()).pipe(file);

            file.on('error', function(err) {
                res.write('error uploading the file');
                res.write(JSON.stringify(err));
                res.statusCode = 500;
                console.log('POST error ' + JSON.stringify(err));
            });

            req.on('end', function() {
                res.write('uploaded file!');
                res.end();
            });

        } else {
            file = fs.createWriteStream(path);
            req.pipe(file);

            file.on('error', function(err) {
                res.write('error uploading the file');
                res.write(JSON.stringify(err));
                res.statusCode = 500;
            });

            req.on('end', function() {
                res.write('uploaded file!');
                res.end();
            });
        }

    } else {
        // We only want to hand this off to the other middleware if this
        // is not a POST, as we're expecting to be the only ones to
        // handle POSTs.
        return next();
    }
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
// Prefix your expression with ! to have it negated (ie. have matching files excluded):
// '!test/spec/**/ */*.tmp'
// templateFramework: 'lodash'

module.exports = function (grunt) {
    
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // We do not want the default behavior of serving only the app folder.
    // Instead we want to serve the base repo directory, as this will give us
    // access to the test dir as well. Further, if you don't have a homescreen
    // defined, it doesn't really make sense to have a single index.html.
    var baseDirForServer = '';
    var tablesConfig = {
        // The base app directory. Note that if you modify this you should
        // also modify the other properties in this object that refer to
        // app
        appDir: 'app',
        appName: 'default',
        // The mount point of the device. Should allow adb push/pull.
        deviceMount: '/sdcard/opendatakit',
        // The mount point of the device for odk collect forms.
        formMount: '/sdcard/odk/forms',
        // The directory where the 'tables' directory containing the tableId
        // directories lives.
        tablesDir: 'app/config/tables',
        // Where the templates for a new tableId folder lives. i.e. if you want
        // to add a table, the contents of this directory would be copied to
        // tablesDir/tableId.
        tableTemplateDir: 'grunttemplates/table/default',
        // tableIdStr will be what we replace in the table template with the
        // provided tableId. E.g. '../%TABLE_ID%_list.html' will become
        // '../myTableId_list.html'
        tableIdStr: '%TABLE_ID%',
        // The string we need to replace with the app name.
        appStr: '%APP%',
        // The output directory
        outputDbDir: 'output/db',
        // The directory where csvs are output.
        outputCsvDir: 'output/csv',
        // The directory where the device.properties and app.properties objects are stored
        outputPropsDir: 'output/props',
        // The directory where the debug objects are output.
        outputDebugDir: 'output/debug',
        // The db directory path on the phone. %APP% should be replaced by app name
		// We use write-ahead-logging, so we need to pull both sqlite.db and sqlite.wal
        deviceDbDirectoryPath: '/sdcard/opendatakit/%APP%/data/webDb',
        xlsxDir: 'xlsxconverter'

    };

    var surveyConfig = {
        // The base app directory. Note that if you modify this you should
        // also modify the other properties in this object that refer to
        // app
        appDir: 'app',
        appName: 'survey',
        // The mount point of the device. Should allow adb push/pull.
        deviceMount: '/sdcard/opendatakit',
        xlsxDir: 'xlsxconverter'

    };

    grunt.initConfig({
        // Here we have to set the objects for the exec task. We are using
        // grunt-exec to execute the adb push and adb pull commands.
        // cmd is the command that is run when calling this task with the
        // target and must return a string.
        exec: {
            adbpush: {
                cmd: function(src, dest) {
                    return 'adb push ' + src + ' ' + dest;
                }
            },
            adbpull: {
                cmd: function(src, dest) {
                    return 'adb pull ' + src + ' ' + dest;
                }
            },
            adbshell: {
                cmd: function(str) {
                    return 'adb shell ' + str;
                }
            },
            adbinstall: {
                cmd: function(str) {
                    return 'adb install ' + str;
                }
            },
            adbdevices: {
                cmd: function(str) {
                    return 'adb devices';
                }
            },
			macGenConvert: {
				cmd: function(str, formDefFile) {
					return 'node macGenConverter.js ' + str + ' > ' + formDefFile; 
				}
			}
        },
        wait: {
            options: {
              delay: 15000
            },
            pause: {
                options: {
                  before : function(options) {
                    console.log('pausing %dms', options.delay);
                  },
                  after: function() {                      
                    console.log('pause end');
                  }
                }
              },
        },
        tables: tablesConfig,
        watch: {
            options: {
                nospawn: true,
                livereload: true
            },
            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    '<%= tables.appDir %>/*.html',
                    '<%= tables.appDir %>/system/**',
                ]
            },
            test: {
                files: ['test/spec/**/*.js'],
                tasks: ['test']
            }
        },
        connect: {
            options: {
                port: SERVER_PORT,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    middleware: function (connect) {
                        return [
                            postHandler,
                            lrSnippet,
                            mountFolder(connect, baseDirForServer),
                            mountDirectory(connect, baseDirForServer)
                        ];
                    }
                }
            },
            test: {
                options: {
                    port: 8001,
                    middleware: function (connect) {
                        return [
                            postHandler,
                            lrSnippet,
                            mountFolder(connect, 'test'),
                            mountFolder(connect, baseDirForServer),
                            mountDirectory(connect, baseDirForServer)
                        ];
                    }
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>/index.html',
                app: (function() {
                    var platform = require('os').platform();
                    // windows: *win*
                    // mac: darwin
                    if (platform.search('win') >= 0 &&
                        platform.search('darwin') < 0) {
                        // Windows expects chrome.
                        grunt.log.writeln('detected Windows environment');
                        return 'chrome';
                    } else {
                        // Mac (and maybe others--add as discovered), expects
                        // Google Chrome
                        grunt.log.writeln('detected non-Windows environment');
                        return 'Google Chrome';
                    }
                })()
            }
        },
    });

    grunt.loadNpmTasks('grunt-wait');

    // We need grunt-exec to run adb commands from within grunt.
    grunt.loadNpmTasks('grunt-exec');

    // Just an alias task--shorthand for doing all the pullings
    grunt.registerTask(
        'adbpull',
        'Perform all the adbpull tasks',
        ['adbpull-debug', 'adbpull-db', 'adbpull-csv']);

    // Just an alias task--shorthand for doing all the pushings
    grunt.registerTask(
        'adbpush',
        'Perform all the adbpush tasks',
        ['eqm-copy-custom', 'adbpull-props', 'remove-folders', 'adbpush-collect', 'adbpush-default-app', 'adbpush-props', 'start-survey']);

    grunt.registerTask(
        'clean',
        'wipe the device',
        ["adbpull-props", "remove-folders", "adbpush-props", "setup"]);


    grunt.registerTask(
        'adbpull-debug',
        'Pull the debug output objects from the device',
        function() {
            var src = tablesConfig.deviceMount + '/' + tablesConfig.appName +
                '/' + tablesConfig.outputDebugDir;
            var dest = tablesConfig.appDir + '/' + tablesConfig.outputDebugDir;
            grunt.log.writeln('adb pull ' + src + ' ' + dest);
            grunt.task.run('exec:adbpull:' + src + ':' + dest);
        });

    grunt.registerTask(
        'adbpull-db',
        'Pull the db from the device',
        function() {
            var dbPath = tablesConfig.deviceDbDirectoryPath;
            dbPath = dbPath.replace(tablesConfig.appStr, tablesConfig.appName);
            var src = dbPath;
            var dest = tablesConfig.appDir + '/' + tablesConfig.outputDbDir;
            grunt.log.writeln('adb pull ' + src + ' ' + dest);
            grunt.task.run('exec:adbpull:' + src + ':' + dest);
        });

    grunt.registerTask(
        'adbpull-csv',
        'Pull any exported csv files from the device',
        function() {
            var src = tablesConfig.deviceMount + '/' + tablesConfig.appName +
                '/' + tablesConfig.outputCsvDir;
            var dest = tablesConfig.appDir + '/' + tablesConfig.outputCsvDir;
            grunt.log.writeln('adb pull ' + src + ' ' + dest);
            grunt.task.run('exec:adbpull:' + src + ':' + dest);
        });

    
    // customPromptTypes are needed for each form cf. https://forum.opendatakit.org/t/odk-survey-counting-repeat-sections/4165/2
    // so until a global customPromptTypes.js becomes available, we copy the one from assets/custom folder to each form folder
    grunt.registerTask(
        'eqm-convert-all',
        'Copies customPromptTypes to forms, then runs xlsx-convert-all',
        function() {            
            grunt.task.run('eqm-copy-custom');
            grunt.task.run('xlsx-convert-all');
        }
    );
    
    grunt.registerTask(
        'eqm-copy-custom',
        'Copies custom*.js files from framework folder to each form',
        function() {
            var platform = require('os').platform();
			var isWindows = (platform.search('win') >= 0 &&
                             platform.search('darwin') < 0);
							 
            var dirs = grunt.file.expand(
                {filter: function(path) {
 						if ( !path.endsWith(".xlsx") ) {
							return false;
						}
						var cells = path.split((isWindows ? "\\" : "/"));
						return (cells.length >= 6) &&
						  ( cells[cells.length-1] === cells[cells.length-2] + ".xlsx" ); 
					},
                 cwd: 'app' },
				'**/*.xlsx',
                '!**/~$*.xlsx'
				);

            
            //var srcDir = 'app/config/assets/framework/forms/framework/';
            var srcDir = 'app/config/assets/custom/';
            var filesToDisseminate = ['customPromptTypes.js'] //, 'customScreenTypes.js'];
            dirs.forEach(function(fileName) {
                //if (fileName == 'config/assets/framework/forms/framework/framework.xlsx') return; //i.e. continue
                filesToDisseminate.forEach(fname => {
                    var dest = 'app/' + fileName.substr(0,fileName.lastIndexOf('/')) + '/' + fname;
                    var src = srcDir + fname;
                    //console.log(jsFile);
                    grunt.log.writeln('file copy ' + src + ' ' + dest);
                    grunt.file.copy(src, dest);
                });
                
            });
        }
    );

    grunt.registerTask(
        'eqm-push-sysscripts',
        'updates scripts in system/survey/js',
        function() {
            // Copy system-files
            var sysFilesToCopy = ['app/system/survey/js/adateHelpers.js', 'app/system/survey/js/freebaseHelpers.js', 'app/system/survey/js/formulaFunctions.js'];
            var sysDest = '/sdcard/opendatakit/default/system/survey/js';
            sysFilesToCopy.forEach(fileName => {
                var src = fileName;
                var dest = sysDest + fileName.substr(fileName.lastIndexOf('/'));
                //console.log(src, dest);
                grunt.task.run('exec:adbpush:' + src + ':' + dest);
            });
        }
    );

    grunt.registerTask(
        'xlsx-convert-all',
        'Run the XLSX converter on all form definitions',
        function() {
			var platform = require('os').platform();
			var isWindows = (platform.search('win') >= 0 &&
                             platform.search('darwin') < 0);
							 
            var dirs = grunt.file.expand(
                {filter: function(path) {
 						if ( !path.endsWith(".xlsx") ) {
							return false;
						}
						var cells = path.split((isWindows ? "\\" : "/"));
						return (cells.length >= 6) &&
						  ( cells[cells.length-1] === cells[cells.length-2] + ".xlsx" ); 
					},
                 cwd: 'app' },
				'**/*.xlsx',
                '!**/~$*.xlsx'
				);

            // Now run these files through macGenConvert.js
            dirs.forEach(function(fileName) {
				// fileName uses forward slashes on all platforms
				var xlsFile;
				var formDefFile;
				var cells;
				xlsFile = 'app/' + fileName;
				cells = xlsFile.split('/');
				cells[cells.length-1] = 'formDef.json';
				formDefFile = cells.join('/');
				grunt.log.writeln('macGenConvert: ' + xlsFile + ' > ' + formDefFile);
				grunt.task.run('exec:macGenConvert:' + xlsFile + ':' + formDefFile);
            });
        });

    var zipAllFiles = function( destZipFile, filesList, completionFn ) {
			// create a file to stream archive data to. 
			var fs = require('fs');
			var archiver = require('archiver');

			var output = fs.createWriteStream(destZipFile);
			var archive = archiver('zip', {
				store: true // Sets the compression method to STORE. 
			});
			 
			// listen for all archive data to be written 
			output.on('close', function() {
			  console.log(archive.pointer() + ' total bytes');
			  console.log('archiver has been finalized and the output file descriptor has closed.');
			  completionFn(true);
			});
			 
			// good practice to catch this error explicitly 
			archive.on('error', function(err) {
			  throw err;
			});
			 
			// pipe archive data to the file 
			archive.pipe(output);
				
			filesList.forEach(function(fileName) {
                //  Have to add app back into the file name for the adb push
                var src = tablesConfig.appDir + '/' + fileName;
                grunt.log.writeln('archive.file(' + src + ', {name: ' + fileName + '} )');
                archive.file(src, {name: fileName }, function(err) {
					  if(err) {
						grunt.log.writeln('error ' + err + ' adding ' + src + ' to file ' + destZipFile);
				}} );
			});
			// finalize the archive (ie we are done appending files but streams have to finish yet) 
			archive.finalize();
    };

    grunt.registerTask(
        'build-zips',
        'BROKEN: does not compress and last file is not terminated properly. Construct the configzip and systemzip for survey and tables',
        function() {
			var done = this.async();
			
			var buildDir = 'build' +
				'/zips';
             
            if (grunt.file.exists(buildDir)) {
                grunt.file.delete(buildDir + '/');
            }
			
			grunt.file.mkdir(buildDir);
			grunt.file.mkdir(buildDir + '/survey/');
			grunt.file.mkdir(buildDir + '/tables/');

            var surveySystemZipFiles = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
				'system/survey/templates/**',
                'system/survey/js/**',
                'system/libs/**',
                'system/js/**',
                'system/index.html',
				'!**/.DS_Store',
                '!**/~$*.xlsx');

            var surveyConfigZipFiles = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
				'config/assets/framework/**',
                'config/assets/commonDefinitions.js',
                'config/assets/img/play.png',
                'config/assets/img/form_logo.png',
                'config/assets/img/backup.png',
                'config/assets/img/advance.png',
                'config/assets/css/odk-survey.css',
				'!**/.DS_Store',
                '!**/~$*.xlsx');

            var tablesSystemZipFiles = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
				'system/tables/test/**',
                'system/tables/js/**',
                'system/libs/**',
                'system/js/**',
				'!**/.DS_Store',
                '!**/~$*.xlsx');

            var tablesConfigZipFiles = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
                'config/assets/libs/jquery*',
                'config/assets/libs/d3*',
                'config/assets/libs/d3-amd/**',
                'config/assets/commonDefinitions.js',
                'config/assets/img/little_arrow.png',
				'!**/.DS_Store',
                '!**/~$*.xlsx');

			zipAllFiles(buildDir + '/survey/systemzip', surveySystemZipFiles, 
				function(outcome) {
					if ( outcome ) {
						zipAllFiles(buildDir + '/survey/configzip', surveyConfigZipFiles, 
							function(outcome) {
								if ( outcome ) {
									zipAllFiles(buildDir + '/tables/systemzip', tablesSystemZipFiles, 
										function(outcome) {
											if ( outcome ) {
												zipAllFiles(buildDir + '/tables/configzip', tablesConfigZipFiles, 
													function(outcome) {
														if ( outcome ) {
															grunt.log.writeln('success!');
															done(true);
														} else {
															done('failing on /tables/configzip with error: ' + outcome);
														}
													});
											} else {
												done('failing on /tables/systemzip with error: ' + outcome);
											}
										});
								} else {
									done('failing on /survey/configzip with error: ' + outcome);
								}
							});
					} else {
						done('failing on /survey/systemzip with error: ' + outcome);
					}
				});
		});

    grunt.registerTask(
        'adbpush-default-app',
        'Push everything in the app directory (except system) to the device',
        function() {
            // Do not push any system, data or output files.
            // The first parameter is an options object where we specify that
            // we only want files--this is important because otherwise when
            // we get directory names adb will push everything in the directory
            // name, effectively pushing everything twice.  We also specify that we
            // want everything returned to be relative to 'app' by using 'cwd'.
            var dirs = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
				'.nomedia',
                '**',
                '!system/**',
				'!data/**',
				'!output/**',
                '!**/~$*.xlsx');

            // Now push these files to the phone.
            dirs.forEach(function(fileName) {
                //  Have to add app back into the file name for the adb push
                var src = tablesConfig.appDir + '/' + fileName;
                var dest =
                    tablesConfig.deviceMount +
                    '/' +
                    tablesConfig.appName +
                    '/' +
                    fileName;
                grunt.log.writeln('adb push ' + src + ' ' + dest);
                grunt.task.run('exec:adbpush:' + src + ':' + dest);
            });
        });

    grunt.registerTask(
        'adbpush-tables',
        'Push everything for tables only to the device',
        function() {
            // We do not need any system, data or output files.
            // The first parameter is an options object where we specify that
            // we only want files--this is important because otherwise when
            // we get directory names adb will push everything in the directory
            // name, effectively pushing everything twice.  We also specify that we
            // want everything returned to be relative to 'app' by using 'cwd'.
            var dirs = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
				'.nomedia',
                '**',
                '!system/**',
				'!data/**',
				'!output/**',
                '!**/~$*.xlsx');

            // Now push these files to the phone.
            dirs.forEach(function(fileName) {
                //  Have to add app back into the file name for the adb push
                var src = tablesConfig.appDir + '/' + fileName;
                var dest =
                    tablesConfig.deviceMount +
                    '/' +
                    tablesConfig.appName +
                    '/' +
                    fileName;
                grunt.log.writeln('adb push ' + src + ' ' + dest);
                grunt.task.run('exec:adbpush:' + src + ':' + dest);
            });

            // And then we want to put the collect forms in the right place.
            // This will push the collect forms for ALL the tables, but since
            // only the files used in the Tables demo follows the convention
            // required by the adbpush-collect task, that is ok.
            grunt.task.run('adbpush-collect');

        });

    grunt.registerTask(
        'adbpush-systemjs',
        'Push everything for tables only to the device',
        function() {
            // We do not need any system, data or output files.
            // The first parameter is an options object where we specify that
            // we only want files--this is important because otherwise when
            // we get directory names adb will push everything in the directory
            // name, effectively pushing everything twice.  We also specify that we
            // want everything returned to be relative to 'app' by using 'cwd'.
            var dirs = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
				'.nomedia',
                '**',
                '!system/**',
                'system/tables/js/**',
                'system/survey/**',
				'!data/**',
				'!output/**',
                '!config/**',
                '!**/~$*.xlsx');

            // Now push these files to the phone.
            dirs.forEach(function(fileName) {
                //  Have to add app back into the file name for the adb push
                var src = tablesConfig.appDir + '/' + fileName;
                var dest =
                    tablesConfig.deviceMount +
                    '/' +
                    tablesConfig.appName +
                    '/' +
                    fileName;
                grunt.log.writeln('adb push ' + src + ' ' + dest);
                grunt.task.run('exec:adbpush:' + src + ':' + dest);
            });

            // And then we want to put the collect forms in the right place.
            // This will push the collect forms for ALL the tables, but since
            // only the files used in the Tables demo follows the convention
            // required by the adbpush-collect task, that is ok.
            grunt.task.run('adbpush-collect');

        });

    grunt.registerTask(
        'adbpush-scan',
        'Push everything for scan tables to the device',
        function() {
            // In the alpha demo we want Tables and Survey. For this demo,
			// it had needed a push of the system files, but we won't do that
			// here. We only want a subset of the app/tables files,
            // however. So, we are going to get everything except that
            // directory and then add back in the ones that we want.
            // The first parameter is an options object where we specify that
            // we only want files--this is important because otherwise when
            // we get directory names adb will push everything in the directory
            // name, effectively pushing everything twice.  We also specify that we
            // want everything returned to be relative to 'app' by using 'cwd'.
            var dirs = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
				'.nomedia',
                '**',
				'!system/**',
				'!data/**',
				'!output/**',
				'!config/assets/**',
                '!config/tables/**',
                'config/tables/scan_example/**',
                '!**/~$*.xlsx');

            // Now push these files to the phone.
            dirs.forEach(function(fileName) {
                //  Have to add app back into the file name for the adb push
                var src = tablesConfig.appDir + '/' + fileName;
                var dest =
                    tablesConfig.deviceMount +
                    '/' +
                    tablesConfig.appName +
                    '/' +
                    fileName;
                grunt.log.writeln('adb push ' + src + ' ' + dest);
                grunt.task.run('exec:adbpush:' + src + ':' + dest);
            });
        });

	//
	// returns a function that will handle the copying of files into the
	// build/ + infix.substr(1) folder with any files containing ".infix."
	// stripped of that infix and any folders ending in ".infix" also stripped.
	//
	var infixRenameCopier = function(demoInfix, offsetDir) {
		return function(fileName) {
			//  Have to add app back into the file name for the adb push
			var src;
			if ( offsetDir !== undefined && offsetDir !== null && offsetDir !== "" ) {
				src = offsetDir +
					'/' +
					fileName;
			} else {
				src = fileName;
			}
			var isInfixed = false;
			// need to handle infixed directories and files
			var destFileName = fileName;
			var idx = destFileName.indexOf(demoInfix + ".");
			while ( idx >= 0 ) {
				// file...
				isInfixed = true;
				destFileName = destFileName.substring(0,idx) + destFileName.substring(idx+demoInfix.length);
				idx = destFileName.indexOf(demoInfix + ".");
			}
			
			var idxDir = destFileName.indexOf(demoInfix + "/");
			while ( idxDir >= 0 ) {
				// directory...
				isInfixed = true;
				destFileName = destFileName.substring(0,idxDir) + destFileName.substring(idxDir+demoInfix.length);
				idxDir = destFileName.indexOf(demoInfix + "/");
			}
			
			var buildDir = 'build' +
				'/' +
				demoInfix.substring(1);

			var baseDir = buildDir;

			if ( offsetDir !== undefined && offsetDir !== null && offsetDir !== "" ) {
				baseDir = baseDir +
					'/' +
					offsetDir;
			}

			var dest;
			if ( isInfixed ) {
				// copy the original so that, e.g, grunt adbpush-tables-tablesdemo will work
				dest = baseDir +
					'/' +
					fileName;
				grunt.log.writeln('file copy ' + src + ' ' + dest);
				grunt.file.copy(src, dest);
			}
			// and copy the renamed destination file so that
			// grunt adbpush will also work.
			dest = baseDir +
				'/' +
				destFileName;
			grunt.log.writeln('file copy ' + src + ' ' + dest);
			grunt.file.copy(src, dest);
		};
	};

	//
	// returns a function that will handle the adb push of files onto the
	// device with any files containing ".infix." stripped of that infix 
	// and any folders ending in ".infix" also stripped.
	//
	var infixRenameAdbPusher = function(demoInfix, offsetDir) {
		           // Now push these files to the phone.
        return function(fileName) {
			//  Have to add app back into the file name for the adb push
			var src;
			if ( offsetDir !== undefined && offsetDir !== null && offsetDir !== "" ) {
				src = offsetDir +
				'/' +
				fileName;
			} else {
				src = fileName;
			}

			var isInfixed = false;
			// need to handle infixed directories and files
			var destFileName = fileName;
			var idx = destFileName.indexOf(demoInfix + ".");
			while ( idx >= 0 ) {
				// file...
				isInfixed = true;
				destFileName = destFileName.substring(0,idx) + destFileName.substring(idx+demoInfix.length);
				idx = destFileName.indexOf(demoInfix + ".");
			}
			
			var idxDir = destFileName.indexOf(demoInfix + "/");
			while ( idxDir >= 0 ) {
				// directory...
				isInfixed = true;
				destFileName = destFileName.substring(0,idxDir) + destFileName.substring(idxDir+demoInfix.length);
				idxDir = destFileName.indexOf(demoInfix + "/");
			}

			var dest =
				tablesConfig.deviceMount +
				'/' +
				tablesConfig.appName +
				'/' +
				destFileName;
			grunt.log.writeln('adb push ' + src + ' ' + dest);
			grunt.task.run('exec:adbpush:' + src + ':' + dest);
		};
	};

	var largeDataSetFiles = function(grunt) {
        // We only want a subset of the app/tables files,
		// however. So, we are going to get everything except that
		// directory and then add back in the ones that we want.
		// The first parameter is an options object where we specify that
		// we only want files--this is important because otherwise when
		// we get directory names adb will push everything in the directory
		// name, effectively pushing everything twice.  We also specify that we
		// want everything returned to be relative to 'app' by using 'cwd'.
		var dirs = grunt.file.expand(
			{filter: 'isFile',
			 cwd: 'app' },
			'.nomedia',
			'**',
			'!system/**',
			'!data/**',
			'!output/**',
			'!config/tables/**',
			'config/assets/**',
            'config/tables/large_dataset/**',
            'config/tables/testRun/**',
            '!**/~$*.xlsx');

		return dirs;
	};

    grunt.registerTask(
        'adbpush-largeDataSet500',
        'Push everything for large data set to the device',
        function() {
            var dirs = largeDataSetFiles(grunt);

            // Now push these files to the phone.
            dirs.forEach(infixRenameAdbPusher(".largeDataSet500", tablesConfig.appDir));
        }
    );

    grunt.registerTask(
        'adbpush-largeDataSet3000',
        'Push everything for large data set to the device',
        function() {
            var dirs = largeDataSetFiles(grunt);

            // Now push these files to the phone.
            dirs.forEach(infixRenameAdbPusher(".largeDataSet3000", tablesConfig.appDir));
        }
    );
	
    grunt.registerTask(
        'adbpush-survey',
        'Push everything for survey to the device',
        function() {
            // We do not need any system or output files.
            // The first parameter is an options object where we specify that
            // we only want files--this is important because otherwise when
            // we get directory names adb will push everything in the directory
            // name, effectively pushing everything twice.  We also specify that we
            // want everything returned to be relative to 'app' by using 'cwd'.
            var dirs = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
				'.nomedia',
                '**',
                '!system/**',
				'!data/**',
				'!output/**',
                '!**/~$*.xlsx');

            // Now push these files to the phone.
            dirs.forEach(function(fileName) {
                //  Have to add app back into the file name for the adb push
                var src = surveyConfig.appDir + '/' + fileName;
                var dest =
                    surveyConfig.deviceMount +
                    '/' +
                    surveyConfig.appName +
                    '/' +
                    fileName;
                grunt.log.writeln('adb push ' + src + ' ' + dest);
                grunt.task.run('exec:adbpush:' + src + ':' + dest);
            });

        });

    grunt.registerTask(
        'adbpush-collect',
        'Push any collect form to the device',
        function() {
            // The full paths to all the table id directories.
            var tableIdDirs = grunt.file.expand(tablesConfig.tablesDir + '/*');
            // Now we want just the table ids.
            var tableIds = [];
            var COLLECT_FORMS = "collect-forms";
            tableIdDirs.forEach(function(element) {
                tableIds.push(element.substr(element.lastIndexOf('/') + 1));
            });
            grunt.log.writeln(this.name + ', found tableIds: ' + tableIds);
            // Now that we have the table ids, we need to push any form in the
			// collect-forms directory. There should be only one, but we aren't
			// picky.
            tableIds.forEach(function(tableId) {
                var files = grunt.file.expand(
                    tablesConfig.tablesDir + '/' + tableId +
                    '/' + COLLECT_FORMS + '/*',
                    '!' + tablesConfig.tablesDir + '/' + tableId +
                    '/' + COLLECT_FORMS + '/~$*.xlsx');
                files.forEach(function(file) {
                    var src = file;
                    // We basically want to push all the contents under
                    // /sdcard/opendatakit/APP/tables/tableId/collect-forms
					// to /sdcard/odk/forms
					// I.e., this folder should contain things like:
					//  .../formid.xml
					//  .../formid-media/form_logo.jpg
					//  .../formid-media/...
					//  .../formid2.xml
					//
                    // The names of the files will stay the same
				    // when we push them
                    var destPos = src.indexOf(COLLECT_FORMS);
                    destPos = destPos + COLLECT_FORMS.length;
                    var destPath = src.substr(destPos);
                    var dest = tablesConfig.formMount + destPath;
                    grunt.log.writeln(
                        'adb push ' + src + ' ' + dest);
                    grunt.task.run('exec:adbpush: ' + src + ':' + dest);
                });
            });
        });

    // This task adds a table. This includes making a folder in the app/tables
    // directory and instantiating the directory structure that is expected.
    // It also creates templates for the js and html files based on the given
    // tableId.
    grunt.registerTask(
        'addtable',
        'Adds a table directory structure',
        function(tableId) {
            if (arguments.length !== 1) {
                grunt.fail.fatal(this.name +
                ' requires one tableId. Call using "' +
                this.name + ':tableId"');
            } else {

                /**
                 * Reads the file in srcPath, replaces all instances of
                 * tablesConfig.tableIdStr with tableId, and writes it to
                 * destPath.
                 */
                var replaceIdAndWrite = function(srcPath, destPath, tableId) {
                    var contents = grunt.file.read(srcPath);
                    // Now modify it.
                    // We need to do a global replace.
                    var regex = new RegExp(tablesConfig.tableIdStr, 'g');
                    contents =
                        contents.replace(regex, tableId);
                    grunt.file.write(destPath, contents);
                };

                grunt.log.writeln(
                    this.name + ' making table with id ' + tableId);
                var tableDir = tablesConfig.tablesDir + '/' + tableId;
                // First we need to make the directory in the tables dir.
                grunt.file.mkdir(tableDir);
                // Now we copy the files from the grunttemplates directory into
                // the new directory. We're going to do the files that depend
                // on the tableId independntly, doing a string replace on our
                // flag for the marker.
                // These will be the files in the tableTemplateDir we want to
                // copy directly. You must terminate with / if it is a dir.
                var toCopy = [
                    'forms/',
                    'collect-forms/',
                    'instances/'
                ];
                grunt.log.writeln(this.name + ', copying files: ' + toCopy);
                toCopy.forEach(function(path) {
                    var srcPath = tablesConfig.tableTemplateDir + '/' + path;
                    var destPath = tableDir + '/' + path;
                    // We have to do a special case on if it's a directory.
                    if (grunt.util._.endsWith(srcPath, '/')) {
                        grunt.file.mkdir(destPath);
                    } else {
                        grunt.file.copy(srcPath, destPath);
                    }
                });
                // Now we will copy the files to which we need to add the
                // table id.
                var detailHtml = {
                    srcPath: tablesConfig.tableTemplateDir +
                        '/html/detail.html',
                    destPath: tableDir + '/html/' + tableId + '_detail.html'
                };
                var detailJs = {
                    srcPath: tablesConfig.tableTemplateDir + '/js/detail.js',
                    destPath: tableDir + '/js/' + tableId + '_detail.js'
                };
                var listHtml = {
                    srcPath: tablesConfig.tableTemplateDir + '/html/list.html',
                    destPath: tableDir + '/html/' + tableId + '_list.html'
                };
                var listJs = {
                    srcPath: tablesConfig.tableTemplateDir + '/js/list.js',
                    destPath: tableDir + '/js/' + tableId + '_list.js'
                };
                var filesToReplace = [
                    detailHtml,
                    detailJs,
                    listHtml,
                    listJs
                ];
                grunt.log.writeln(this.name + ', writing dynamic table files');
                filesToReplace.forEach(function(element) {
                    replaceIdAndWrite(
                        element.srcPath,
                        element.destPath,
                        tableId);
                });
            }

        });

    grunt.registerTask('server', function (target) {

        if (target === 'test') {
            return grunt.task.run([
                'connect:test',
                'watch:livereload'
            ]);
        }

        grunt.task.run([
            'connect:livereload',
            'open',
            'watch'
        ]);
    });

    grunt.registerTask('default', [
        'server'
    ]);

    grunt.registerTask(
        'adbpush-system',
        'Push the system directory to the survey appName on the device',
        function() {
            // Useful for testing working system code before constructing
			// the framework zip file and adding it to the APK res/raw
			// folder.
            // The first parameter is an options object where we specify that
            // we only want files--this is important because otherwise when
            // we get directory names adb will push everything in the directory
            // name, effectively pushing everything twice.  We also specify that we
            // want everything returned to be relative to 'app' by using 'cwd'.
            var dirs = grunt.file.expand(
                {filter: 'isFile',
                 cwd: 'app' },
                'system/**',
                '!**/~$*.xlsx');

            // Now push these files to the phone.
            dirs.forEach(function(fileName) {
                //  Have to add app back into the file name for the adb push
                var src = surveyConfig.appDir + '/' + fileName;
                var dest =
                    surveyConfig.deviceMount +
                    '/' +
                    surveyConfig.appName +
                    '/' +
                    fileName;
                grunt.log.writeln('adb push ' + src + ' ' + dest);
                grunt.task.run('exec:adbpush:' + src + ':' + dest);
            });

        });

    grunt.registerTask(
        "killall",
        "Force stops survey, tables and services",
        function killall() {
            var apps = ["survey", "tables", "services"];
            for (var i = 0; i < apps.length; i++) {
                console.log("Force stopping ".concat(apps[i]));
                grunt.task.run("exec:adbshell:am force-stop org.opendatakit.".concat(apps[i]));
            }
        });

    grunt.registerTask(
        "uninstall",
        "Uninstalls ODK tools",
        function remove_folders() {
            grunt.task.run("remove-folders");
            var apps = ["core", "services", "survey.android", "survey", "tables"];
            for (var i = 0; i < apps.length; i++) {
                console.log("Uninstalling ".concat(apps[i]));
                grunt.task.run("exec:adbshell:pm uninstall org.opendatakit.".concat(apps[i]));
            }
        });
    grunt.registerTask(
        "remove-folders",
        "Removes the opendatakit folders",
        function remove_folders() {
            grunt.task.run("killall");
            var folders = [tablesConfig.deviceMount + "/" + tablesConfig.appName];//, "/sdcard/odk"];
            for (var i = 0; i < folders.length; i++) {
                console.log("Deleting ".concat(folders[i]));
                grunt.task.run("exec:adbshell:rm -rf ".concat(folders[i]));
            }

        });

    grunt.registerTask('eqm-init',
    'Initializes a phressh Lenovo E7 tablet',
    function eqmInit() {
        grunt.log.writeln("Initializing phresh Lenovo E7 tablet.")
        //grunt.task.run("exec:adbshell:am force-stop org.opendatakit.".concat(apps[i]));
        grunt.task.run("exec:adbinstall:./Tablet_Install/services.apk");
        grunt.task.run("exec:adbinstall:./Tablet_Install/survey.apk");
        grunt.task.run("exec:adbinstall:./Tablet_Install/tables.apk");
        grunt.task.run("exec:adbinstall:./Tablet_Install/OIFilemanager.apk");
        //grunt.task.run('adbpush-collect');
        grunt.task.run('adbpush-default-app');        
        grunt.task.run('setup');
        
    });    

    grunt.registerTask(
        "adbpull-props",
        "Copies the properties from the device",
        function props() {
            var base = tablesConfig.deviceMount.concat("/", tablesConfig.appName);
            var destbase = tablesConfig.appDir.concat("/", tablesConfig.outputPropsDir, "/");
            var files = ["/config/assets/app.properties", "/data/device.properties"];
            grunt.task.run("force:on")
            for (var i = 0; i < files.length; i++) {
                grunt.task.run("exec:adbpull:".concat(base, files[i], ":", destbase, basename(files[i])));
            }
            grunt.task.run("adbpull-fixprops")
            grunt.task.run("force:restore")
        });
    grunt.registerTask(
        "adbpull-fixprops",
        "Removes init strings from device.properties",
        function props() {
            var file = tablesConfig.appDir.concat("/", tablesConfig.outputPropsDir, "/device.properties");
            var props = grunt.file.read(file).split("\n");
            for (var i = 0; i < props.length; i++) {
                if (props[i].indexOf("tool_last_initialization_start_time") >= 0) {
                    props[i] = "";
                }
            }
            grunt.file.write(file, props.join("\n"));
        });
    grunt.registerTask(
        "adbpush-props",
        "Copies the properties to the device",
        function props() {
            var base = tablesConfig.deviceMount.concat("/", tablesConfig.appName);
            var destbase = tablesConfig.appDir.concat("/", tablesConfig.outputPropsDir, "/");
            var files = ["/config/assets/app.properties", "/data/device.properties"];
            grunt.task.run("force:on")
            for (var i = 0; i < files.length; i++) {
                grunt.task.run("exec:adbpush:".concat(destbase, basename(files[i]), ":", base, files[i]));
            }
            grunt.task.run("force:restore")
        });
    var basename = function basename(path) {
        var idx = path.lastIndexOf("/");
        if (path.length != idx + 1) {
            return path.substr(idx + 1);
        } else {
            return basename(path.substr(0, idx))
        }
    }
    grunt.registerTask(
        "setup",
        "Launch the login and sync screen",
        function() {
            //console.log("exec:adbshell:am start -a android.intent.action.MAIN -n org.opendatakit.services/.sync.actions.activities.SyncActivity --es appName "+tablesConfig.appName+" --es showLogin true");
            grunt.task.run("exec:adbshell:am start -a android.intent.action.MAIN -n org.opendatakit.services/.sync.actions.activities.SyncActivity --es appName "+tablesConfig.appName+" --es showLogin true");
        }
    )
    grunt.registerTask(
        'start-survey',
        'Starts survey app',
        function() {
            grunt.task.run("exec:adbshell:am start -a android.intent.action.MAIN -n org.opendatakit.survey/.activities.SplashScreenActivity");
        }
    );
    // https://stackoverflow.com/questions/16612495/continue-certain-tasks-in-grunt-even-if-one-fails
    var previous_force_state = grunt.option("force");
    grunt.registerTask("force",function(set){
        if (set === "on") grunt.option("force", true);
        if (set === "off") grunt.option("force", false);
        if (set === "restore") grunt.option("force", previous_force_state);
    });
};
