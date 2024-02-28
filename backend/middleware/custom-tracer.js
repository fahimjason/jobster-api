const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

const createTracer = (tracerName) => {
    return trace.getTracer(tracerName);
}

const createSpan = (spanName, tracer, parentSpan) => {
    if(parentSpan) {
        // Start another span. If already started a span, so that'll  
        // be the parent span, and this will be a child span.
        const ctx = trace.setSpan(context.active(), parentSpan);
        return tracer.startSpan(spanName, undefined, ctx);
    }

    return tracer.startSpan(spanName);
}

const tracingError = (span, message) => {
    span.setStatus({code: SpanStatusCode.ERROR, message: message});
    span.end();
}

module.exports = { createTracer, createSpan, tracingError }
