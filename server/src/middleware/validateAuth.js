const { body, validationResult } = require('express-validator');
//add DNS checking when live
const validateRegister = [
    body('email')
        .trim()
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),//converts to lowercase and removes whitespaces etc.

    body('username')
        .trim()
        .isLength({ min: 3, max: 15}).withMessage('Username must be 3-15 characters long')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),

    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
        .matches(/[0-9]/).withMessage('Password must contain at least one number.')
        .matches(/[\W_]/).withMessage('Password must contain at least one special character (e.g., !, @, #, $, %).'),

    (req, res, next) => {
        const errors = validationResult(req);
        //send error array if validation fails
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array()});
        }
        next();//move to the next function in teh chain, from validateRegister to authController.register
    }
];

const validateLogin = [
    body('email')
        .trim()
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        //send error array if validation fails
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array()});
        }
        next();
    }
]

module.exports = { validateRegister, validateLogin };