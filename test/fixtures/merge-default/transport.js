'use strict';

module.exports = function tr(pipe) {
    pipe.on('request', request => {
        pipe.respond(request);
    });
};
