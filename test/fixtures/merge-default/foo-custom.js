'use strict';

module.exports = function foo(pipe, config) {
    pipe.on('request', (request, next) => {
        next(config);
    });
};
