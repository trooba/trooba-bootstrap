'use strict';

module.exports = function tr(pipe, config) {
    pipe.on('request', request => {
        pipe.respond(config);
    });
};
