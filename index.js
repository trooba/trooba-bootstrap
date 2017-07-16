'use strict';

const mergeDeep = require('merge-deep');
const Trooba = require('trooba');
const resolveFrom = require('resolve-from');
const shortstop = require('shortstop');
const shortstopHandlers = require('shortstop-handlers');

module.exports = function bootstrap(profiles, pipesConfig) {
    return new Provider(profiles, pipesConfig);
};

class Provider {
    constructor(profiles, pipeConfigs) {
        this.profiles = profiles || {};
        this.pipeConfigs = pipeConfigs || {};
        this.pipes = {};
    }

    createService(serviceName, apiInterface) {
        apiInterface = apiInterface || 'service';
        return this.createPipe({
            sort: (a, b) => {
                return a.transport ? +1 :
                    b.transport ? -1 :
                    a.priority - b.priority;
            },
            name: serviceName,
            apiInterface: apiInterface
        });
    }

    createClient(clientName, apiInterface) {
        apiInterface = apiInterface || 'client';
        return this.createPipe({
            sort: (a, b) => {
                return a.transport ? 1 :
                    b.transport ? -1 :
                    a.priority - b.priority;
            },
            name: clientName,
            apiInterface: apiInterface
        });
    }

    createPipe(options) {
        const name = options.name;
        const pipeMeta = this.pipes[name];
        let apiInterface = options.apiInterface && options.apiInterface !== 'default:api' ?
            options.apiInterface : undefined;
        let pipe;

        if (pipeMeta && apiInterface) {
            apiInterface = options.apiInterface;
            pipe = pipeMeta[apiInterface];
            if (pipe) {
                return pipe;
            }
            pipe = pipeMeta[apiInterface] =
                pipeMeta.$default.create(apiInterface);
            return pipe;
        }

        if (pipeMeta) {
            return pipeMeta.$default;
        }

        // build a new pipe
        const pipeConfig = this.pipeConfigs[name];
        if (!pipeConfig) {
            throw new Error(`Cannot find pipe config for pipe:${name}`);
        }

        // get specific profile or fallback to default one
        const profileName = pipeConfig.$profile || 'default';
        const profile = this.profiles[profileName];
        if (!profile) {
            throw new Error(`Cannot find profile:${profileName} for pipe:${name}`);
        }

        // create extended profile for the requested client
        const pipeProfile = mergeDeep({}, profile, pipeConfig);
        /*
        build the pipe using handler conifguration merged from profiles and specific to the given client and profile
        */
        pipe = Object
        .keys(pipeProfile)
        .reduce((memo, handlerName) => {
            // skip native artifacts that start with '$'
            if (handlerName.charAt(0) !== '$') {
                const handler = pipeProfile[handlerName];
                handler.$name = handlerName;
                const modulePath = handler.module;
                if (!modulePath) {
                    throw new Error(`Cannot find module:${modulePath} for handler:${handlerName}; pipe:${name} and profile:${profileName}`);
                }
                // resolve module
                if (typeof modulePath === 'string') {
                    handler.module = tryRequire(modulePath);
                }
                if (!handler.module) {
                    throw new Error(`Cannot load module:${modulePath}, handler:${handlerName}, pipe:${name}, profile:${profileName}`);
                }
                if (typeof handler.module !== 'function') {
                    throw new Error(`Cannot handler is not a function in module:${modulePath}, handler:${handlerName}, pipe:${name}, profile:${profileName}`);
                }

                memo.push(handler);
            }
            return memo;
        }, [])
        .sort(options.sort)
        .reduce((pipe, handler) => {
            return pipe.use(handler.module, handler.config);
        }, Trooba);

        pipe = pipe.build();
        this.pipes[name] = {
            $default: pipe,
            $config: pipeProfile
        };

        if (apiInterface) {
            pipe = pipe.create(apiInterface);
            this.pipes[name][apiInterface] = pipe;
        }

        return pipe;
    }

    /*
        When profiles are updated, the affected pipes will be rebuilt
    */
    updateProfiles(profiles, override) {
        if (!profiles) {
            return;
        }

        Object.keys(profiles).forEach(profileName => {
            Object.keys(this.pipes).forEach(name => {
                const pipeProfileName =
                    this.pipes[name].$config.$profile || 'default';

                if (pipeProfileName === profileName) {
                    delete this.pipes[name];
                }
            });
        });

        if (override) {
            this.profiles = mergeDeep({}, profiles);
            this.pipes = {};
            return;
        }

        this.profiles = mergeDeep(this.profiles, profiles);
    }

    /*
        When pipes are updated, the affected pipes will be rebuilt
    */
    updatePipes(pipeConfigs, override) {
        if (!pipeConfigs) {
            return;
        }

        Object.keys(pipeConfigs).forEach(name => {
            delete this.pipes[name];
        });

        if (override) {
            this.pipeConfigs = mergeDeep({}, pipeConfigs);
            this.pipes = {};
            return;
        }

        this.pipeConfigs = mergeDeep(this.pipeConfigs, pipeConfigs);
    }
}

function tryRequire(name) {
    try {
        return require(name);
    }
    catch (err) {
        return undefined;
    }
}

module.exports.Utils = {
    resolveConfig(config, root, callback) {

        const resolver = shortstop.create();
        resolver.use('path',   shortstopHandlers.path(root));
        resolver.use('file',   shortstopHandlers.file(root));
        resolver.use('base64', shortstopHandlers.base64());
        resolver.use('env',    shortstopHandlers.env());
        resolver.use('require', createRequireResolver(root));
        resolver.use('exec',   shortstopHandlers.exec(root));

        resolver.resolve(config, callback);
    }
};

function createRequireResolver(dirname) {
    return function requireResolver(target) {
        var methodSeparator = target.lastIndexOf('#');
        var methodName;

        if (methodSeparator !== -1) {
            methodName = target.substring(methodSeparator+1);
            target = target.substring(0, methodSeparator);
        }

        var modulePath = resolveFrom(dirname, target);
        var requiredModule = require(modulePath);
        if (methodName) {
            requiredModule = requiredModule[methodName];
            if (requiredModule == null) {
                throw new Error('Method with name "' + methodName + '" not found in module at path "' + modulePath + '"');
            }
        }
        return requiredModule;
    };
}
