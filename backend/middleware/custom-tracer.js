const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

const createTracer = (tracerName) => {
    const tracer = trace.getTracer(tracerName); 

    return tracer;
}

const createSpan = (spanName, tracer, parentSpan) => {
    if(parentSpan) {
        // Start another span. If already started a span, so that'll  
        // be the parent span, and this will be a child span.
        const ctx = trace.setSpan(context.active(), parentSpan);
        const span = tracer.startSpan(spanName, undefined, ctx);

        return span;
    }

    const span = tracer.startSpan(spanName);
    return span;
}

const tracingError = (span, message) => {
    span.setStatus({code: SpanStatusCode.ERROR, message: message});
    span.end();

    return;
}

module.exports = { createTracer, createSpan, tracingError }