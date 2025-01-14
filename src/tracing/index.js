const initJaegerTracer = require('jaeger-client').initTracer;
const Logger = require('@naturacosmeticos/clio-nodejs-logger');
const AsyncLocalStorage = require('../utils/async-local-storage');

const config = {
  reporter: {
    agentHost: process.env.JAEGER_AGENT_HOST,
    agentPort: process.env.JAEGER_AGENT_PORT,
    collectorEndpoint: process.env.JAEGER_COLLECTOR,
  },
  sampler: {
    hostPort: process.env.JAEGER_SAMPLE_HOST_PORT,
    param: process.env.JAEGER_SAMPLE_PARAM ? process.env.JAEGER_SAMPLE_PARAM : 1,
    type: process.env.JAEGER_SAMPLE_TYPE ? process.env.JAEGER_SAMPLE_TYPE : 'remote',
  },
  serviceName: process.env.APP_NAME,
};

module.exports = class JaegerTracer {
  constructor() {
    this.tracer = initJaegerTracer(config, {
      logger: {
        error: function logError(msg) {
          Logger.current().error(`Error during Jaeger tracing. ${msg}`);
        },
        info: function logInfo(msg) {
          Logger.current().info(`Additional information from Jaeger tracing. ${msg}`);
        },
      },
    });
  }

  getTracer() { return this.tracer; }

  error(spanName, message, parameters) {
    const tracer = this.getTracer();

    const rootSpan = AsyncLocalStorage.getValue('rootSpan');

    const span = tracer.startSpan(spanName, { childOf: rootSpan });

    span.error(message, {
      ...parameters,
    });

    span.setTag('error', true);
    span.setTag('sampling.priority', 1);

    span.finish();
  }
};
