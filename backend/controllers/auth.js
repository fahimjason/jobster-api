const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const { trace } = require('@opentelemetry/api');
const User = require('../models/User');
const {customTracer, getActiveSpan} = require('../middleware/custom-tracer');

const customSpan = customTracer('tracer-user-login');

const register = async (req, res) => {
        const user = await User.create({ ...req.body });
        const token = user.createJWT();

        res.status(StatusCodes.CREATED).json({
            user: {
                email: user.email,
                lastName: user.lastName,
                location: user.location,
                name: user.name,
                token,
            },
        });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const parentSpan = customSpan.startSpan('user-login');

    // customSpan.startActiveSpan('', async (span) => {
        if (!email || !password) {
            throw new BadRequestError('Please provide email and password');
        }
        // const tracer = trace.getTracer('init')
        const childSpan = customSpan.startSpan('db-call-and-user-validation', { parent: parentSpan });
        // customSpan.startActiveSpan('', async (span) => {
            try{
                const user = await User.findOne({ email });
    
                if (!user) {
                    throw new UnauthenticatedError('Invalid Credentials');
                }
            
                const isPasswordCorrect = await user.comparePassword(password);
            
                if (!isPasswordCorrect) {
                    throw new UnauthenticatedError('Invalid Credentials');
                }
            
                // compare password
                const token = user.createJWT();


                res.status(StatusCodes.OK).json({
                    user: {
                        email: user.email,
                        lastName: user.lastName,
                        location: user.location,
                        name: user.name,
                        token,
                    },
                });

                childSpan.end();
            } catch(e) {
                const activeSpan = trace.getSpan(api.context.active());
                activeSpan?.recordException(e);
            }
        // });

        const activeSpan = trace.getActiveSpan();
        activeSpan?.setAttribute('userId', req.body.email);

        parentSpan.end();
    // });
};

const updateUser = async (req, res) => {
    const { email, name, lastName, location } = req.body;

    if (!email || !name || !lastName || !location) {
        throw new BadRequest('Please provide all values');
    }

    const user = await User.findOne({ _id: req.user.userId });

    user.email = email;
    user.name = name;
    user.lastName = lastName;
    user.location = location;

    await user.save();

    const token = user.createJWT();

    res.status(StatusCodes.OK).json({
        user: {
            email: user.email,
            lastName: user.lastName,
            location: user.location,
            name: user.name,
            token,
        },
    });
};

module.exports = {
    register,
    login,
    updateUser
};