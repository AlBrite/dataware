import { Validator } from './index';

const data = {
    username: 'Bright'
};

Validator.make(data, {
    username: ['required', 'm']
})