# FormGuardJs Class Documentation

This is a comprehensive guide to the `FormGuardJs` class, inspired by Laravel’s Validation but tailored for JavaScript applications. The class provides a rich set of validation rules and supports custom validation callbacks.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Validation Rules Reference](#validation-rules-reference)
  - [Required Rules](#required-rules)
  -	[Data Type Rules](#data-type-rules)
  - [String Formatting Rules](#string-formatting-rules)
  - [Special Rules](#special-rules)
  - [Comparison Rules](#comparison-rules)
  - [Miscellaneous Rules](#,iscellaneous-rules) 
- [Usage](#usage)
  - [Basic Examples](#basic-examples)
  - [Advanced Examples](#advanced-examples)
- [Customizations](#custoizations)
  - [Custom Messages](#custom-messages)
  - [Custom Attributes](#custom-attributes)
  - [Custom Rule Callbacks](#custom-rule-callbacks)

## Introduction

The `FormGuard` class allows you to validate form data based on a variety of built-in rules. You can define your validation rules, custom error messages, and attributes that map to human-readable names for your fields.

## Installation

You can install the FormGuard in your project by including the `FormGuard` class in your JavaScript/TypeScript application.

## Usage

### Basic Examples

Here’s a simple example that validates the `name` and `age` fields with basic rules:

```js
const rules = {
    name: 'required|min:5',
    age: 'required|integer',
};

const messages = {
    nameRequired: 'Name is required',
    nameMin: 'Minimum value is :min',
    ageRequired: 'Age is required',
    ageInteger: 'Age value is not an integer',
};

const attributes = {
    name: 'Full Name',
    age: 'Age',
};

FormGuard.make(rules, messages, attributes);
    .then(({ validated, formData }) => {
        // Handle success
    })
    .catch(error => {
        console.error(error);
    });
```

### Rules as Array

You can also pass validation rules as an array:

```js
const rules = {
    name: ['required', 'min:5'],
    age: ['required', 'integer'],
};

FormGuard.make(rules, messages, attributes)
    .then(({ validated, formData }) => {
        // Handle success
    })
    .catch(error => {
        console.error(error);
    });
```

### Rules as Object

If you prefer, you can define your validation rules as objects:

```js
const rules = {
    name: { required: true, min: [5] },
    age: { required: true, integer: true },
};

FormGuard.make(rules, messages, attributes)
    .then(({ validated, formData }) => {
        // Handle success
    })
    .catch(error => {
        console.error(error);
    });
```

### Custom Rule Callbacks

#### Define Custom Callbacks

```js
FormGuard.add('exists', ({value, fails}) => {
    if (!value) {
        fails('Name already exists');
    }
});
```


```js
FormGuard.add('exists', ({value, fails}) => {
    return value !== false;
});
```

### Definine Custom Callbacks with options

```js
FormGuard.add({
    exists: {
        fn: ({value, fails}) => value,
        message: 'Name already exists'
    },

    // Add more custom Rules
});
```


### Defining custom Rules globally

go to `./core/config.js`, inside customRules define the rules
like

```js
{
    customRules: {
        ruleName: {
            fn: () => {}, // Define the callback here
            message: 'Custom Message'
        }
    }
}
```

```js
FormGuard.exists = ({ value, fails }) => {
    if (!value) {
        fails('Name already exists');
    }
};
```

You can use custom validation callbacks as part of the rules:

```js
// Usages of custom callbacks
const rules1 = {
    name: ['required', 'min:5', FormGuard.exists],
    age: 'required|integer',
};

// or as an item in an array 

const rules2 = {
    name: ['required', 'min:5', 'exists'],
    age: 'required|integer',
};

// or as a string:

const rules3 = {
    name: 'required|min:5|exists',
    age: 'required|integer',
};


FormGuard.make(rules1, messages, attributes).then().catch();
FormGuard.make(rules2, messages, attributes).then().catch();
FormGuard.make(rules3, messages, attributes).then().catch();
    
```

Or you can define an inline function as a callback:

```js
const rules = {
    name: ['required', 'min:5', ({ value, fails }) => {
        if (!value) {
            fails('Name already exists');
        }
    }],
    age: 'required|integer',
};

FormGuard.make(rules, messages, attributes);
    .then(({ validated, formData }) => {
        // Handle success
    })
    .catch(error => {
        console.error(error);
    });
```

## Validation Rules Reference

### Required Rules

| Rule                          | Description                                                              |
|-------------------------------|--------------------------------------------------------------------------|
| `required`                    | The field must not be empty.                                            |
| `required_if:field,value`     | The field is required if another field has a specific value.            |
| `required_unless:field,value` | The field is required unless another field has a specific value.        |
| `required_with:fields`        | The field is required if any of the specified fields are present.       |
| `required_with_all:fields`    | The field is required if all of the specified fields are present.       |
| `required_without:fields`     | The field is required if any of the specified fields are not present.   |
| `required_without_all:fields` | The field is required if none of the specified fields are present.      |

### Data Type Rules

| Rule                   | Description                                                      |
|------------------------|------------------------------------------------------------------|
| `numeric`              | The field must be a number.                                      |
| `string`               | The field must be a string.                                      |
| `integer`              | The field must be an integer.                                    |
| `array`                | The field must be an array.                                      |
| `file`                 | The field must be a valid file.                                  |
| `files`                | The field must contain multiple files.                           |
| `json`                 | The field must be a valid JSON string.                           |
| `boolean`              | The field must be either `true` or `false`.                      |
| `date`                 | The field must be a valid date.                                  |
| `email`                | The field must be a valid email address.                         |
| `url`                  | The field must be a valid URL.                                   |
| `ip`                   | The field must be a valid IP address.                            |
| `uuid`                 | The field must be a valid UUID.                                  |

### String Formatting Rules

| Rule                    | Description                                                      |
|-------------------------|------------------------------------------------------------------|
| `trim`                  | The field's value will be trimmed of whitespace.                |
| `capitalize:scope`            | The field's value will be capitalized if `scope` is not provided. Set `all` scope to capitalize all the value. Set `none` scope to uncapitalize all the value                          |
| `lowercase`             | The field's value must be lowercase.                            |
| `uppercase`             | The field's value must be uppercase.                            |
| `alpha`                 | The field must contain only alphabetic characters.              |
| `alpha_num`            | The field must contain only letters and numbers.                |
| `alpha_dash`            | The field must contain letters, numbers, dashes, and underscores.|
| `alpha_spaces`          | The field must contain only letters and spaces.                 |
| `digits:value`          | The field must have exactly the specified number of digits.     |
| `mimes:types`           | The file must match one of the given MIME types.               |

### Special Rules

| Rule                     | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| `accepted`               | The field must be accepted (for checkboxes).                    |
| `confirmed`              | The field must have a matching `*_confirmation` field.          |
| `credit_card`            | The field must be a valid credit card number.                   |
| `contains:substring`     | The field must contain a specific substring.                    |
| `not_contains:value`     | The field's value must not contain the specified value.          |
| `in:values`              | The field must be included in the given list of values.         |
| `not_in:values`          | The field's value must not be in the given list of values.      |
| `exists`                 | The field must pass a custom existence check (see callbacks).   |
| `pattern:regex`          | The field's value must match the specified regex pattern.        |

### Comparison Rules

| Rule                     | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| `min:value`              | The field's value must be at least the specified minimum.        |
| `max:value`              | The field's value must not exceed the specified maximum.         |
| `between:min,max`        | The field's value must be between `min` and `max`.              |
| `same:otherfield`        | The field's value must match another field's value.              |
| `gt:field`               | The field must be greater than the specified field.              |
| `gte:field`              | The field must be greater than or equal to the specified field.  |
| `lt:field`               | The field must be less than the specified field.                 |
| `lte:field`              | The field must be less than or equal to the specified field.     |
| `range:min,max`          | The field's value must be within the given range.                |

### Miscellaneous Rules

| Rule                     | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| `filled`                 | The field must have a value, even if empty.                     |
| `nullable`               | The field can be `null`.                                        |
| `active_url`             | The field must be a valid active URL.                            |
| `image`                  | The file must be an image.                                       |
| `audio`                  | The file must be an audio file.                                  |
| `video`                  | The file must be a video file.                                  |
| `pattern:regex`          | The field's value must match the specified regex pattern.        |

---

## Custom Messages

You can customize error messages using the `messages` parameter when creating a new FormGuard instance. Messages can use placeholders like `:attribute`, `:min`, or `:max` to dynamically insert values.

```js


const messages = {
    nameRequired: 'Name is required',
    nameMin: 'Name must be at least :min characters',
    ageRequired: 'Age is required',
    ageInteger: 'Age must be an integer',
};
```

## Custom Attributes

You can customize attribute names for friendlier error messages by passing an `attributes` object:

```js
const attributes = {
    name: 'Full Name',
    age: 'Age',
};
```

This allows the error messages to display `Full Name` instead of `name`.

## Custom Callbacks

### Registering a Custom Rule

You can register custom validation rules using functions. Here's an example of creating and using a custom validation rule:

```js
FormGuard.exists = ({ value, fails }) => {
    if (!value) {
        fails('This value does not exist.');
    }
};

const rules = {
    name: ['required', 'exists'],
};

FormGuard.make(rules, messages, attributes)
    .then(({ validated, formData }) => {
        // Handle success
    })
    .catch(error => {
        console.error(error);
    });
```

### Inline Callback Example

You can also provide inline custom rules as callbacks:

```js
const rules = {
    name: ['required', ({ value, fails }) => {
        if (value !== 'allowed_name') {
            fails('This name is not allowed.');
        }
    }],
};

FormGuard.make(rules, messages, attributes)
    .then(({ validated, formData }) => {
        // Handle success
    })
    .catch(error => {
        console.error(error);
    });
```


Or you can define an inline function as a callback:

```js
const rules = {
    name: ['required', 'min:5', ({ value, fails }) => {
        if (!value) {
            fails('Name already exists');
        }
    }],
    age: 'required|integer',
};

FormGuard.make(rules, messages, attributes)
    .then(({ validated, formData }) => {
        // Handle success
    })
    .catch(error => {
        console.error(error);
    });
```


### Using defineForm To Validate Form

```js
FormGuard.defineForm(
    formSelector,
    rules,
    messages,
    attributes
);
```

Usage:

```html
    <!--index.html-->
    <html>
        <head>
            ...
            <script src="http://npmpackagelist.org/formguard.js"></script>

        </head>
        <body>

            <form method="POST" action="/api/login" id="signup-form">
                <input type="text" name="email"/>
                <input type="text" name="first_name"/>
                <input type="text" name="last_name"/>
                <input type="text" name="username"/>
                <input type="password" name="password"/>
                <input type="password" name="password_confirmation"/>
                <button type="submit">Sign Up</button>
            </form>

        </body>
        <script src="./index.js"></script>
    </html>
```

```js
// index.js
const rules = {
    email: 'required|email',
    first_name: 'required|alpha',
    last_name: 'required|alpha',
    password: 'required|password|confirmed'
};

const messages = {
    emailRequired: 'Email Address is required',
    first_nameRequired: ':attribute is requred',
};

const attributes = {
    first_name: 'First Name',
    last_name: 'Last Name',
};


const validator = FormGuard.defineForm(
    'signup-form',
    rules,
    messages,
    attributes
);

validator
.on('submitted', (response, {setAuth}) => {
    setAuth(response.token);
})
.on('submit', ({validated, formData}) => {

})
```