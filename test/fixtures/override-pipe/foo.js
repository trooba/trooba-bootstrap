'use strict';

module.exports = function foo(pipe) {
    pipe.set('client', pipe => {
        return {
            hello(name, callback) {
                pipe.create().request(name, callback);
            }
        };
    });
};
