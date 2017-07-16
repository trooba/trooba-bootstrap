'use strict';

module.exports = function foo(pipe) {
    pipe.on('request', (request, next) => {
        request.push('foo');
        next();
    });

    pipe.set('client', pipe => {
        return {
            hello(name, callback) {
                pipe.create().request(name, callback);
            }
        };
    });
};
