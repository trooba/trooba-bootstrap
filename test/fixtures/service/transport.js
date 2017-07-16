'use strict';

module.exports = function tr(pipe) {
    pipe.on('request', request => {
        request.push('transport');
        pipe.respond(request);
    });
};
