# trooba-bootstrap

[![Greenkeeper badge](https://badges.greenkeeper.io/trooba/trooba-bootstrap.svg)](https://greenkeeper.io/)

Bootstrap Trooba pipeline from configuration file.

[![codecov](https://codecov.io/gh/trooba/trooba-bootstrap/branch/master/graph/badge.svg)](https://codecov.io/gh/trooba/trooba-bootstrap)
[![Build Status](https://travis-ci.org/trooba/trooba-bootstrap.svg?branch=master)](https://travis-ci.org/trooba/trooba-bootstrap) [![NPM](https://img.shields.io/npm/v/trooba-bootstrap.svg)](https://www.npmjs.com/package/trooba-bootstrap)
[![Downloads](https://img.shields.io/npm/dm/trooba-bootstrap.svg)](http://npm-stat.com/charts.html?package=trooba-bootstrap)
[![Known Vulnerabilities](https://snyk.io/test/github/trooba/trooba-bootstrap/badge.svg)](https://snyk.io/test/github/trooba/trooba-bootstrap)

This functionality is important when one needs to scale to 100+ applications.

The idea is it is always easy to inject new configuration than ask applications developers of more than 100+ applications/teams to update their code to meet new service requirements. This also allows to provide default configurations by platform team.

### Install

```bash
$ npm install trooba-bootstrap -S
```

### Usage

#### Configuration

Configuration has two main artifacts:

* Handlers profile definition is where platform team would define all handlers that can be used to build pipelines and their default configuration if any.

* Service client or endpoint configuration is actual configuration used by application developer to define specific configuration for service clients and/or endpoints.

##### Handlers profile declaration

The definition specifies a path to the module, execution priority (specifies position priority) and default configuration if needed.

```js
// define profiles for easy reference in pipeline definitions
const profiles = {
    // default profile to be used if no profile specified
    "default": {
        "trace": {
            // Priority defines execution order
            "priority": 10,
            "module": "trooba-opentrace"
        },
        "circuit": {
            "priority": 20,
            // module that provide circuit breaker functionality
            "module": "trooba-hystrix-handler",
            // default configuration
            "config": {
                "timeout": 0,
                "circuitBreakerErrorThresholdPercentage": 50
            }
        },
        "retry": {
            "priority": 30,
            "module": "trooba-retry" // TBD (to be defined/implemented)
        },
        "http-transport": {
            "transport": true,
            "module": "trooba-http-transport"
        }
    },
    // profile for soap service calls
    "soap": {
        "trace": {
            // Priority defines execution order
            "priority": 10,
            "module": "trooba-opentrace"
        },
        "circuit": {
            "priority": 20,
            // module that provide circuit breaker functionality
            "module": "trooba-hystrix-handler",
            // default configuration
            "config": {
                "timeout": 0,
                "circuitBreakerErrorThresholdPercentage": 70
            }
        },
        "retry": {
            "priority": 30,
            "module": "trooba-retry" // TBD (to be defined/implemented)
        },
        // We added new handler that adopts XML request to http request
        "soap": {
            "priority": 40,
            "module": "trooba-soap" // TBD
        }
        "http-transport": {
            "transport": true,
            "module": "trooba-http-transport"
        }
    }
}
```

##### Service client or endpoint configuration

This section would declare a configuration for a specific pipeline. For example, we can have one configuration to make service calls to one service 'foo' and other for service 'bar'.

The pipeline configuration can provide specific configurations for every handler if needed. This config will override default configuration properties for the given handler or transport.

```js
const clients = {
    // id of the pipe
    "my-service-rest-client": {
        // since no profile given, it will use default profile
        // "$profile": "default",
        // custom configuration for handlers and pipe overall
        "circuit": {
            "config": {
                // modify circuit breaker property from 50 to 70
                "circuitBreakerErrorThresholdPercentage": 70
            }
        },
        "retry": {
            // change priority
            "priority": 35,
            "config": {
                // set retry to 3
                "retry": 3
            }
        },
        // provide transport service configuration
        // one can also provide this via pipe.context if transport understands it
        "http-transport": {
            "config": {
                "context": "my-app-http-context",
                "hostname": "localhost",
                "port": 8000,
                "protocol": "http:",
                "path": "/view/item",
                "socketTimeout": 2000
            }
        }
    },
    "my-service-soap-client": {
        // uses soap profile
        "$profile": "soap",
        // provide custom configuration for transport
        "http-transport": {
            "config": {
                "context": "my-app-http-context",
                "hostname": "localhost",
                "port": 8000,
                "protocol": "http:",
                "path": "/view/item",
                "socketTimeout": 2000
            }
        }
    },
    // we can extend existing profile for the service
    "my-service-extend-client": {
        // define custom pipeline
        "$profile": "soap",
        // adding custom metrics handler
        "metrics": {
            // want to go as close as possible to the transport in the pipeline
            "priority": 1000,
            "module": "metrics-module"
        },
        // configure transport
        "http-transport": {
            "config": {
                "context": "my-app-http-context",
                "hostname": "localhost",
                "port": 8000,
                "protocol": "http:"
            }
        }
    }
}
```

##### Bootstrapping from config

```js
const provider = require('trooba-bootstrap')(profiles, clients);

// Update route: if handler is already there, it will override it
// This can be used to listen to config changes and updating it on the fly
Provider.updateProfiles(profiles);

// if client is already there, it will override it
// This also can be used to listen to config changes and updating it on the fly
Provider.updatePipes(clients);

// Create a client and make a call
Provider.createClient('my-service-rest-client');
    .create({ 'some': 'context' })
    .request({foo:'bar'}, console.log);
```

###### Sharing handlers between middleware and service invocation pipelines.

In this case one needs to be aware of a few differences:

* The handler priorities may need to be different.
* The transport always goes first and then the handlers in execution order.
* Client configs become routes for incoming traffic.
* Some of the handlers may not be needed or new ones needs to be added.

The above requirements may require to re-define priorities for the routes.

###### Define middleware for the incoming traffic

```js
const profiles = {
    "default": {
        "http-transport": {
            "config": {
                // default ports
                "port": [8000, 8443]
            }
        },
        "router-match": {
            "priority": 0,
            "module": "trooba-http-router/matcher"  // TBD
        },
        "retry": {},
        "router-invoke": {
            "priority": 1000,
            "module": "trooba-http-router/invoker" // TBD
        }
    }
};

const middleware = {
    "my-service": {
        // this will use default profile
        "$profile": "default",
        // pipe handlers
        "http-transport": {
            "config": {
                "context": "my-app-http-context"
            }
        },
        // provide our specific routes
        "router-match": {
            "config": {
                "routes": "./routes.json"
            }
        },
        // adding some of our own middleware
        "jsonParser": {
            "priority": 50
        },
        "cookies": {
            "priority": 60,
            "module": "cookies-module"
        },
        "trace": {
            // turn off tracer
            "enabled": false
        }
    }
};

const provider = require('trooba-bootstrap')(profiles, middleware);

// Create a service instance
// for example, you can look at grpc service: https://github.com/trooba/trooba-grpc-transport#trooba-based-service
const app = Provider.createService('my-service');
// Note: listen method is provided by custom API injected by transport
app.listen(8000, () => {
    console.log('The server is ready');
})
```
