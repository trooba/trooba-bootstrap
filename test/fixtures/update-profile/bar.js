'use strict';

module.exports = function bar(pipe) {
    pipe.set('client', pipe => {
        return {
            hello(name, callback) {
                pipe.create().request(name, callback);
            }
        };
    });
};
