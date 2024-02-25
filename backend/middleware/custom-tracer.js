const { trace, context } = require('@opentelemetry/api');

// Configure OpenTelemetry
const tracer = require('../opentelemetry');
const tracerProvider = tracer('jobster-api');
// let rootTracer;

// const createTracer = (name) => {
//     tracerProvider = tracerProvider(name);
// }

const StartTrace = (traceName) => {
   return (req, res, next) => {
        const tracer = tracerProvider.getTracer('express-tracer');
        const span = tracer.startSpan('signup-endpoint');
      
        // Add custom attributes or log additional information if needed
        span.setAttribute('user', 'user made');
      
        // Pass the span to the request object for use in the route handler
        context.with(trace.setSpan(context.active(), span), () => {
          next();
        });
    }
}

const customTracer = (name) => {
    return trace.getTracer(name);
}

const getActiveSpan = () => {
    return trace.getActiveSpan();
}

module.exports = {tracerProvider, StartTrace, customTracer, getActiveSpan}; 