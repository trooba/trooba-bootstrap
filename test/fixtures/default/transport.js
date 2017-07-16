'use strict';

module.exports = function tr(pipe) {
    pipe.on('request', request => {
        request.push('transport');
        pipe.respond(request);
    });

    pipe.set('service', pipe => {
        return {
            hello(name, callback) {
                pipe.create().request(name, callback);
            }
        };
    });
};
