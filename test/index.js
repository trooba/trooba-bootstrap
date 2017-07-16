'use strict';

const Assert = require('assert');
const NodePath = require('path');
const Async = require('async');
const boot = require('..');

describe(__filename, () => {
    it('should create client with default pipe', next => {
        const profilesConfig = require('./fixtures/default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {

                }
            });
            const expectedProfiles = JSON.parse(JSON.stringify(profilesConfig));
            expectedProfiles.default.trace.module =
                NodePath.resolve(process.cwd(), 'test/fixtures/default/foo');
            expectedProfiles.default.circuit.module =
                NodePath.resolve(process.cwd(), 'test/fixtures/default/bar');
            expectedProfiles.default['http-transport'].module =
                NodePath.resolve(process.cwd(), 'test/fixtures/default/transport');

            Assert.ok(provider);
            Assert.deepEqual(['default'], Object.keys(provider.profiles));
            Assert.deepEqual(expectedProfiles, provider.profiles);

            const client = provider.createClient('my-client', 'default:api');
            client.create().request([], (err, response) => {
                Assert.deepEqual([
                    'foo',
                    'bar',
                    'transport'
                ], response);
                next();
            });
        });
    });

    it('should create service pipe with transport first', next => {
        const profilesConfig = require('./fixtures/default-service/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/default-service'), (err, profiles) => {

            const provider = boot(profiles, require('./fixtures/default-service/clients.json'));

            const service = provider.createService('my-service');
            service.hello([], (err, response) => {
                Assert.deepEqual([
                    'transport',
                    'foo',
                    'bar',
                    'controller'
                ], response);
                next();
            });
        });
    });

    it('should create client with default pipe, require resolver', next => {
        const profilesConfig = require('./fixtures/require/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/require'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {

                }
            });

            const client = provider.createClient('my-client', 'default:api');
            client.create().request([], (err, response) => {
                Assert.deepEqual([
                    'foo',
                    'bar',
                    'transport'
                ], response);
                next();
            });
        });
    });

    it('should create client with default pipe, require#method resolver', next => {
        const profilesConfig = require('./fixtures/require-method/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/require-method'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {

                }
            });

            const client = provider.createClient('my-client', 'default:api');
            client.create().request([], (err, response) => {
                Assert.deepEqual([
                    'foo',
                    'bar',
                    'transport'
                ], response);
                next();
            });
        });
    });

    it('should fail to create client with default pipe, require#method resolver', next => {
        const profilesConfig = require('./fixtures/require-method-fail/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/require-method-fail'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {

                }
            });

            Assert.throws(() => {
                provider.createClient('my-client', 'default:api');
            }, /Cannot find profile:default for pipe:my-client/);

            next();
        });
    });

    it('should create client with default pipe, createService', next => {
        const profilesConfig = require('./fixtures/service/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/service'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-service': {

                }
            });

            const client = provider.createService('my-service', 'default:api');
            client.create().request([], (err, response) => {
                Assert.deepEqual([
                    'foo',
                    'bar',
                    'transport'
                ], response);
                next();
            });
        });
    });

    it('should cache pipe', next => {
        const profilesConfig = require('./fixtures/default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            Assert.ok(provider.createClient('my-client', 'default:api') ===
                provider.createClient('my-client', 'default:api'));

            next();
        });
    });

    it('should cache pipe with custom API', next => {
        const profilesConfig = require('./fixtures/default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            Assert.ok(provider.createClient('my-client') ===
                provider.createClient('my-client'));

            next();
        });
    });

    it('should use generic cache pipe with custom API', next => {
        const profilesConfig = require('./fixtures/default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            Assert.ok(provider.createClient('my-client', 'default:api') ===
                provider.createClient('my-client', 'default:api'));

            Assert.ok(provider.createClient('my-client') ===
                provider.createClient('my-client'));

            next();
        });
    });

    it('should fail not finding the client with empty profiles', () => {
        const provider = boot();
        Assert.throws(() => {
            provider.createClient('my-client');
        }, /Cannot find pipe config for pipe:my-client/);
    });

    it('should fail not finding the client', () => {
        const profiles = require('./fixtures/default/profiles.json');
        const provider = boot(profiles);
        Assert.throws(() => {
            provider.createClient('my-client-unknown');
        }, /Cannot find pipe config for pipe:my-client-unknown/);
    });

    it('should fail not finding the module', next => {
        const profiles = require('./fixtures/missing/profiles.json');
        boot.Utils.resolveConfig(
        profiles,
        NodePath.resolve(__dirname, './fixtures/missing'), (err, profiles) => {
            const provider = boot(profiles, {
                "my-client": {}
            });
            Assert.throws(() => {
                provider.createClient('my-client');
            }, /Cannot load module:.+test\/fixtures\/missing\/unknown, handler:trace, pipe:my-client, profile:default/);
            next();
        });

    });

    it('should fail not finding the module', next => {
        const profiles = require('./fixtures/wrong-path/profiles.json');
        boot.Utils.resolveConfig(
        profiles,
        NodePath.resolve(__dirname, './fixtures/wrong-path'), (err, profiles) => {
            const provider = boot(profiles, {
                "my-client": {}
            });
            Assert.throws(() => {
                provider.createClient('my-client');
            }, /Cannot find module:undefined for handler:circuit; pipe:my-client and profile:default/);
            next();
        });

    });

    it('should fail loading handler module', next => {
        const profiles = require('./fixtures/missing-handler/profiles.json');
        boot.Utils.resolveConfig(
        profiles,
        NodePath.resolve(__dirname, './fixtures/missing-handler'), (err, profiles) => {
            const provider = boot(profiles, {
                "my-client": {}
            });
            Assert.throws(() => {
                provider.createClient('my-client', 'default:api');
            }, /Cannot handler is not a function in module:.+\/test\/fixtures\/missing-handler\/foo, handler:foo, pipe:my-client, profile:default/);
            next();
        });
    });

    it('should extend default profile', next => {
        const profilesConfig = require('./fixtures/extend/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/extend'), (err, profiles) => {

            const provider = boot(profiles, require('./fixtures/extend/clients.json'));

            Assert.ok(provider);
            Assert.deepEqual(['default', 'other'], Object.keys(provider.profiles));

            const client = provider.createClient('my-client', 'default:api');
            client.create().request([], (err, response) => {
                Assert.deepEqual([
                    'bar',
                    'foo',
                    'foo-req',
                    'transport'
                ], response);
                next();
            });
        });
    });

    it('should extend specific profile', next => {
        const profilesConfig = require('./fixtures/extend-specific/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/extend-specific'), (err, profiles) => {

            const provider = boot(profiles, require('./fixtures/extend-specific/clients.json'));

            Assert.ok(provider);
            Assert.deepEqual(['default', 'other'], Object.keys(provider.profiles));

            const client = provider.createClient('my-client', 'default:api');
            client.create().request([], (err, response) => {
                Assert.deepEqual([
                    'foo',
                    'foo-req',
                    'qaz',
                    'transport'
                ], response);
                next();
            });
        });
    });

    it('should merge default profile and client config', next => {
        const profilesConfig = require('./fixtures/merge-default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/merge-default'), (err, profiles) => {

            boot.Utils.resolveConfig(
            require('./fixtures/merge-default/clients.json'),
            NodePath.resolve(__dirname, './fixtures/merge-default'), (err, clients) => {
                const provider = boot(profiles, clients);

                Assert.ok(provider);
                Assert.deepEqual(['default', 'other'], Object.keys(provider.profiles));

                const client = provider.createClient('my-client', 'default:api');
                client.create().request('req', (err, response) => {
                    Assert.deepEqual(require('./fixtures/merge-default/expected.json'), response);
                    next();
                });
            });
        });
    });

    it('should merge specific profile and client config', next => {
        const profilesConfig = require('./fixtures/merge/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/merge'), (err, profiles) => {

            boot.Utils.resolveConfig(
            require('./fixtures/merge/clients.json'),
            NodePath.resolve(__dirname, './fixtures/merge'), (err, clients) => {
                const provider = boot(profiles, clients);

                Assert.ok(provider);
                Assert.deepEqual(['default', 'other'], Object.keys(provider.profiles));

                const client = provider.createClient('my-client', 'default:api');
                client.create().request('req', (err, response) => {
                    Assert.deepEqual(require('./fixtures/merge/expected.json'), response);
                    next();
                });
            });
        });
    });

    it('should use only client config when profile is missing', next => {
        const profilesConfig = require('./fixtures/default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });
            const expectedProfiles = JSON.parse(JSON.stringify(profilesConfig));
            expectedProfiles.default.trace.module =
                NodePath.resolve(process.cwd(), 'test/fixtures/default/foo');
            expectedProfiles.default.circuit.module =
                NodePath.resolve(process.cwd(), 'test/fixtures/default/bar');
            expectedProfiles.default['http-transport'].module =
                NodePath.resolve(process.cwd(), 'test/fixtures/default/transport');

            Assert.ok(provider);
            Assert.deepEqual(['default'], Object.keys(provider.profiles));
            Assert.deepEqual(expectedProfiles, provider.profiles);

            const client = provider.createClient('my-client', 'default:api');
            client.create().request([], (err, response) => {
                Assert.deepEqual([
                    'foo',
                    'bar',
                    'transport'
                ], response);
                next();
            });
        });
    });

    it('should update profiles and reset pipe, custom API', next => {
        const profilesConfig = require('./fixtures/update-default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            const expectedInstance = provider.createClient('my-client');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            provider.updateProfiles();

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            provider.updateProfiles({
                "default": {}
            });

            Assert.ok(expectedInstance !==
                provider.createClient('my-client'));

            next();
        });
    });

    it('should update profiles and not reset pipe as it was not affected, default, custom API', next => {
        const profilesConfig = require('./fixtures/update-profile/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-profile'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {
                    "$profile": "other"
                }
            });

            const expectedInstance = provider.createClient('my-client');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            provider.updateProfiles({
                "default": {}
            });

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            next();
        });
    });

    it('should update profiles and not reset pipe as it was not affected, other config, custom API', next => {
        const profilesConfig = require('./fixtures/update-profile/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-profile'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {
                    "$profile": "other"
                }
            });

            const expectedInstance = provider.createClient('my-client');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            provider.updateProfiles({
                "other": {}
            });

            Assert.ok(expectedInstance !==
                provider.createClient('my-client'));

            next();
        });
    });

    it('should update profiles and reset pipe', next => {
        const profilesConfig = require('./fixtures/update-default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            const expectedInstance = provider.createClient('my-client', 'default:api');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client', 'default:api'));

            provider.updateProfiles({
                "default": {}
            });

            Assert.ok(expectedInstance !==
                provider.createClient('my-client', 'default:api'));

            next();
        });

    });

    it('should update profiles and not reset pipe as it was not affected, default', next => {
        const profilesConfig = require('./fixtures/update-profile/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-profile'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {
                    "$profile": "other"
                }
            });

            const expectedInstance = provider.createClient('my-client', 'default:api');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client', 'default:api'));

            provider.updateProfiles({
                "default": {}
            });

            Assert.ok(expectedInstance ===
                provider.createClient('my-client', 'default:api'));

            next();
        });
    });

    it('should update profiles and not reset pipe as it was not affected, other config', next => {
        const profilesConfig = require('./fixtures/update-profile/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-profile'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {
                    "$profile": "other"
                }
            });

            const expectedInstance = provider.createClient('my-client', 'default:api');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client', 'default:api'));

            provider.updateProfiles({
                "other": {}
            });

            Assert.ok(expectedInstance !==
                provider.createClient('my-client', 'default:api'));

            next();
        });
    });

    it('should update pipe config and not reset pipe as it was not affected', next => {
        const profilesConfig = require('./fixtures/update-default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            const expectedInstance = provider.createClient('my-client');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            provider.updatePipes();

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            provider.updatePipes({
                "some-pipe": {}
            });

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            next();
        });
    });

    it('should update pipe config and not reset pipe as it was not affected, custom API', next => {
        const profilesConfig = require('./fixtures/update-default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            const expectedInstance = provider.createClient('my-client', 'default:api');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client', 'default:api'));

            provider.updatePipes({
                "some-pipe": {}
            });

            Assert.ok(expectedInstance ===
                provider.createClient('my-client', 'default:api'));

            next();
        });
    });

    it('should update pipe config and reset the pipe that was affected by the update', next => {
        const profilesConfig = require('./fixtures/update-default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            const expectedInstance = provider.createClient('my-client', 'default:api');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client', 'default:api'));

            provider.updatePipes({
                'my-client': {}
            });

            Assert.ok(expectedInstance !==
                provider.createClient('my-client', 'default:api'));

            next();
        });
    });

    it('should update pipe config and reset the pipe that was affected by the update, custom API', next => {
        const profilesConfig = require('./fixtures/update-default/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/update-default'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            const expectedInstance = provider.createClient('my-client');

            Assert.ok(expectedInstance ===
                provider.createClient('my-client'));

            provider.updatePipes({
                "my-client": {}
            });

            Assert.ok(expectedInstance !==
                provider.createClient('my-client'));

            next();
        });
    });

    it('should override profiles', next => {
        const profilesConfig = require('./fixtures/override-profile/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/override-profile'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            const override = {
                "default": {
                    "http-transport": {
                        "transport": true,
                        "module": profiles.default['http-transport'].module,
                        "config": {
                            "modified": "new",
                            "object": {
                                "modified": "new"
                            }
                        }
                    }
                }
            };

            Async.series([
                next => {
                    const client = provider.createClient('my-client', 'default:api');
                    client.create().request('req', (err, response) => {
                        Assert.deepEqual(require('./fixtures/override-profile/expected-before.json'), response);
                        next();
                    });
                },

                next => {
                    provider.updateProfiles(override, true);

                    next();
                },

                next => {
                    const client = provider.createClient('my-client', 'default:api');
                    client.create().request('req', (err, response) => {
                        Assert.deepEqual({
                            "modified": "new",
                            "object": {
                                "modified": "new"
                            }
                        }, response);
                        next();
                    });
                }
            ], next);
        });
    });

    it('should merge profiles', next => {
        const profilesConfig = require('./fixtures/override-profile/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/override-profile'), (err, profiles) => {

            const provider = boot(profiles, {
                'my-client': {}
            });

            Async.series([
                next => {
                    const client = provider.createClient('my-client', 'default:api');
                    client.create().request('req', (err, response) => {
                        Assert.deepEqual(require('./fixtures/override-profile/expected-before.json'), response);
                        next();
                    });
                },

                next => {
                    provider.updateProfiles({
                        "default": {
                            "http-transport": {
                                "config": {
                                    "modified": "new",
                                    "object": {
                                        "modified": "new"
                                    }
                                }
                            }
                        }
                    });

                    next();
                },

                next => {
                    const client = provider.createClient('my-client', 'default:api');
                    client.create().request('req', (err, response) => {
                        Assert.deepEqual(require('./fixtures/override-profile/expected.json'), response);
                        next();
                    });
                }
            ], next);
        });
    });

    it('should override pipes config', next => {
        const profilesConfig = require('./fixtures/override-pipe/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/override-pipe'), (err, profiles) => {

            const configBefore = {
                "modified": "old",
                "stay": "stay",
                "object": {
                    "modified": "old",
                    "stay": "stay"
                }
            };

            const provider = boot(profiles, {
                "my-client": {
                    "http-transport": {
                        "transport": true,
                        "module": profiles.default['http-transport'].module,
                        "config": configBefore
                    }
                }
            });

            const configAfter = {
                "modified": "new",
                "object": {
                    "modified": "new"
                }
            };

            const override = {
                "my-client": {
                    "http-transport": {
                        "transport": true,
                        "module": profiles.default['http-transport'].module,
                        "config": configAfter
                    }
                }
            };

            Async.series([
                next => {
                    const client = provider.createClient('my-client', 'default:api');
                    client.create().request('req', (err, response) => {
                        Assert.deepEqual(configBefore, response);
                        next();
                    });
                },

                next => {
                    provider.updatePipes(override, true);

                    next();
                },

                next => {
                    const client = provider.createClient('my-client', 'default:api');
                    client.create().request('req', (err, response) => {
                        Assert.deepEqual(configAfter, response);
                        next();
                    });
                }
            ], next);
        });
    });

    it('should merge pipes config', next => {
        const profilesConfig = require('./fixtures/merge-pipe/profiles.json');
        boot.Utils.resolveConfig(
            profilesConfig,
            NodePath.resolve(__dirname, './fixtures/merge-pipe'), (err, profiles) => {

            const configBefore = {
                "modified": "old",
                "stay": "stay",
                "object": {
                    "modified": "old",
                    "stay": "stay"
                }
            };

            const provider = boot(profiles, {
                "my-client": {
                    "http-transport": {
                        "transport": true,
                        "module": profiles.default['http-transport'].module,
                        "config": configBefore
                    }
                }
            });

            const configAfter = {
                "modified": "new",
                "object": {
                    "modified": "new"
                }
            };

            const override = {
                "my-client": {
                    "http-transport": {
                        "transport": true,
                        "module": profiles.default['http-transport'].module,
                        "config": configAfter
                    }
                }
            };

            Async.series([
                next => {
                    const client = provider.createClient('my-client', 'default:api');
                    client.create().request('req', (err, response) => {
                        Assert.deepEqual(configBefore, response);
                        next();
                    });
                },

                next => {
                    provider.updatePipes(override);

                    next();
                },

                next => {
                    const client = provider.createClient('my-client', 'default:api');
                    client.create().request('req', (err, response) => {
                        Assert.deepEqual({
                            "modified": "new",
                            "stay": "stay",
                            "object": {
                                "modified": "new",
                                "stay": "stay"
                            }
                        }, response);
                        next();
                    });
                }
            ], next);
        });
    });
});
