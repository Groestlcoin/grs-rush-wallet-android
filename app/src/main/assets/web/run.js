

var _ = require("underscore"),
    spawn = require("child_process").spawn,
    zutils = require("zetta-utils");

function Application() {
    var self = this;
    var args = process.argv.slice(2);

    self.process = { }
    _.each(args, function (name) {
        console.log(('loading: ' + name).bold);

        self.process[name] = new zutils.Process({
            process: process.execPath,
            args: [ name ],
            descr: name,
            logger: new zutils.Logger({ filename: __dirname + '/logs/' + name + '.log' })
        });
        self.process[name].run();
    })
}

GLOBAL.app = new Application();