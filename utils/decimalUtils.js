const Decimal = require('decimal.js'); // npm install decimal.js

const toDecimal = (value) => new Decimal(value);

const add = (a, b) => toDecimal(a).plus(toDecimal(b)).toFixed(2);
const sub = (a, b) => toDecimal(a).minus(toDecimal(b)).toFixed(2);
const mul = (a, b) => toDecimal(a).times(toDecimal(b)).toFixed(2);
const div = (a, b) => toDecimal(a).dividedBy(toDecimal(b)).toFixed(2);

module.exports = { add, sub, mul, div, toDecimal };