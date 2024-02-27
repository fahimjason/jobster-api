const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const User = require('../models/User');

// tracing
const { createTracer, createSpan, tracingError } = require('../middleware/custom-tracer');

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
    const tracer = createTracer('User-AUthentication');
    const span = createSpan('/login', tracer);

    const { email, password } = req.body;

    if (!email || !password) {
        tracingError(span, 'Please provide email and password');
        throw new BadRequestError('Please provide email and password');
    }

    const childSpan = createSpan('db-call-and-token-creation', tracer, span);
    const user = await User.findOne({ email });

    if (!user) {
        tracingError(childSpan, 'Invalid Credentials');
        throw new UnauthenticatedError('Invalid Credentials');
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        tracingError(childSpan, 'Invalid Credentials');
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

    // Set attributes to the span.
    span.setAttribute('userId', email);

    span.end();
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