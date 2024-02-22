require('dotenv').config();
require('express-async-errors');
const cors = require('cors');

// Swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const path = require('path');

// extra security packages
const helmet = require('helmet');
const xss = require('xss-clean');

// Configure OpenTelemetry
const tracer = require('./tracer');
const meter = tracer('jobster-api');

// Configure Prometheus
// const { context, trace } = require('@opentelemetry/api');

const express = require('express');
const app = express();

// connect db
const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');

// routers
const authRouter = require('./routes/auth');
const jobRouter = require('./routes/jobs');

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust proxy', 1);

const calls = meter.createHistogram('http-calls');

app.use((req,res,next)=>{
    const startTime = Date.now();
    req.on('end',()=>{
        const endTime = Date.now();
        calls.record(endTime-startTime,{
            route: req.route?.path,
            status: res.statusCode,
            method: req.method
        })
    })
    next();
});

app.use(express.static(path.resolve(__dirname, './client/build')));
app.use(express.json());
app.use(helmet());

app.use(xss());

// enable CORS
app.use(cors());

// app.use((req, res, next) => {
//     const tracer = tracerProvider.getTracer('express-tracer');
//     const span = tracer.startSpan('signup-endpoint');
  
//     // Add custom attributes or log additional information if needed
//     span.setAttribute('payload', req.body);
  
//     // Pass the span to the request object for use in the route handler
//     context.with(trace.setSpan(context.active(), span), () => {
//         next();
//     });
// });

app.get('/', (req, res) => {
    res.send('<h1>Jobster API</h1><a href="/api-docs">Documentation</a>');
});
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', authenticateUser, jobRouter);

// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
// });

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();
