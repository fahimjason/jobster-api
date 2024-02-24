const { trace } = require('@opentelemetry/api');

const customTracer = (name) => {
    return trace.getTracer(name);
}

const getActiveSpan = () => {
    return trace.getActiveSpan();
}

module.exports = {customTracer, getActiveSpan}; 