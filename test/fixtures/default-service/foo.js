'use strict';

module.exports = function foo(pipe) {
    pipe.on('request', (request, next) => {
        request.push('foo');
        next();
    });
};
