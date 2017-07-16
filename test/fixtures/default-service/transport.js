'use strict';

module.exports = function tr(pipe) {
    pipe.on('request', request => {
        request.push('transport');
        pipe.respond(request);
    });

    pipe.set('service', pipe => {
        return {
            hello(request, callback) {
                request.push('transport');
                pipe.create().request(request, callback);
            }
        };
    });
};
