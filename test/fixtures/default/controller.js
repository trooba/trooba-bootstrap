'use strict';

module.exports = function controller(pipe) {
    pipe.on('request', (request, next) => {
        pipe.respond(request);
    });
};
