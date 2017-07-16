'use strict';

module.exports = function controller(pipe) {
    pipe.on('request', (request, next) => {
        request.push('controller');
        pipe.respond(request);
    });
};
