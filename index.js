var through = require('through2');
var gutil = require('gulp-util');
var spawn = require('child_process').spawn;
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-casperjs-options';

function casper(options) {
    options = options || {};

    if(options.xunit){
        var xunit = '--xunit=' + options.xunit;
    }

    var cmd = (typeof options.command === 'undefined') ? 'test' : options.command;

    var files = [];

    var read = function(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            this.emit('error', new PluginError({
                plugin: PLUGIN_NAME,
                message: 'Streams are not supported.'
            }));
            return cb(null, file);
        }
        files.push(file.path);

        this.push(file);

        cb(null, file);
    };

    var end = function(cb) {
        cmd = cmd ? (Array.isArray(cmd) ? cmd : cmd.split(' ')) : [];

        //console.log(cmd.concat(files));

        var tempArr = cmd.concat(files);

        if(xunit) {
            tempArr.push(xunit)
        }

        var casperChild = spawn('casperjs', tempArr);

        casperChild.stdout.on('data', function(data) {
            var msg = data.toString().slice(0, -1);
            gutil.log(PLUGIN_NAME + ':', msg);
        });

        var self = this;
        casperChild.on('close', function(code) {
            var success = code === 0;
            if (!success) {
                self.emit('error', new PluginError({
                    plugin: PLUGIN_NAME,
                    message: 'code ' + code
                }));
            }
            cb();
        });
    };

    return through.obj(read, end);
}

module.exports = casper;