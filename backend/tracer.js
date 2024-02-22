const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { MeterProvider } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
// const { ParentBasedSampler } = require('@opentelemetry/sdk-trace-base');


function tracer(serviceName) {
    const { endpoint, port } = PrometheusExporter.DEFAULT_OPTIONS;

    const exporter = new PrometheusExporter({}, () => {
        console.log(
            `prometheus scrape endpoint: http://localhost:${port}${endpoint}`,
        );
    });

    const meterProvider = new MeterProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        }),
    });

    meterProvider.addMetricReader(exporter);
    const meter = meterProvider.getMeter('my-service-meter');

    const traceExporter = new OTLPTraceExporter({
        url: 'http://jaeger:4318/v1/traces',
    });

    const sdk = new NodeSDK({
        traceExporter,
        serviceName: serviceName,
        instrumentations: [getNodeAutoInstrumentations({
            "@opentelemetry/instrumentation-fs": {
                enabled: false,
            }
        })]
    });

    sdk.start();

    return meter;
}

module.exports = tracer;
