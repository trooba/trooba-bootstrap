'use strict';

module.exports = function foo(pipe, config) {
    pipe.on('request', (request, next) => {
        request.push('foo');
        request.push(config.request);
        next();
    });
};
