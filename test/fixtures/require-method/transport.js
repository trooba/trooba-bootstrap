'use strict';

module.exports.create = function tr(pipe) {
    pipe.on('request', request => {
        request.push('transport');
        pipe.respond(request);
    });
};
