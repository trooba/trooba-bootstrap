'use strict';

module.exports = function qaz(pipe) {
    pipe.on('request', (request, next) => {
        request.push('qaz');
        next();
    });
};
