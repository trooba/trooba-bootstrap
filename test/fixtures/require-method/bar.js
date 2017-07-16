'use strict';

module.exports = function bar(pipe) {
    pipe.on('request', (request, next) => {
        request.push('bar');
        next();
    });
};
