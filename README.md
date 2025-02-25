# Errorgant

try catch can get messy quickly, Errorgant is a simple, type-safe way to handle errors inline elegantly.

## Features

- 🎯 Type-safe error handling
- 🔍 Discriminated error types with custom keys
- 📦 Optionally include context data with type infer-ed
- 🛡️ Run any throwable function and handle errors inline

## Briefly

- `errorgant` is simpler to create then Error class and it support discriminate key, inferred context
- `errorgantly` run with an arrow function, it catches the error and return an `Errorgant` object with the error attached to ctx for you to handle it inline.
- `isErrorgant` is a powerful type guard, it not only narrowing down a variable to `Errorgant` type, but also can "filter" `Errorgant` by discriminate key so you handle a specific error once at a time.
- (Experimental) `errorgantify`, turns a throwable function not throw, returning an `Errorgant` object with the error attached to ctx. And "it knows generic function", function being `errorgantify` won't lose its generic behavior.

## Installation

```bash
npm install errorgant
# or
yarn add errorgant
# or
pnpm add errorgant
```

## Guide

### try catch vs Errorgant

With try catch, you can only handle errors in one place. And can quickly lose track of what error is thrown where.

```typescript
function mightHaveError() {
  /* ... */
  throw new Error('ERROR_A');
  /* ... */
  throw new Error('ERROR_B');
  /* ... */
  return 'success';
}

try {
  const value = mightThrow();
  /* continue with the value */
} catch (e) {
  /* handle all errors here */
}
```

Instead of throws an error, return an Errorgant object to represent the error.
Even better, pass a key to `errorgant` so you can handle a specific error one at a time discriminately.

```typescript
function mightHaveError() {
  /* ... */
  return errorgant('ERROR_A');
  /* ... */
  return errorgant('ERROR_B');
  /* ... */
}

const value = mightHaveError();

if (isErrorgant(value)) {
  /* handle all errors in one shot */
} else {
  /* continue with the value */
}

if (isErrorgant(value, 'ERROR_A')) {
  /* handle only ERROR_A */
} else if (isErrorgant(value, 'ERROR_B')) {
  /* handle ERROR_B */
} else {
  /* continue with the value */
}
```

### Need more context about the error? `errorgant` get you a inferred context

```typescript
const mightBeAnErrorgant = errorgant('NO_AUTH', {
  msg: 'User should be authenticated',
});
mightBeAnErrorgant.ctx;
//                 ^?
//                 (property) ctx: {
//                   readonly msg: "User should be authenticated";
//                 }
```

### Just want to catch an error inline without writing a wrapper function yourself?

`errorgantly` runs a function and returns an Errorgant, with the error attached in `ctx` property, if the function throws.

```typescript
function mightThrow() {
  if (Math.random() > 0.5) {
    throw new Error('ERROR_A');
  }
  return 'success';
}

const value = errorgantly(mightThrow);

if (isErrorgant(value)) {
  const theError = value.ctx;
  //    ^? unknown
} else {
  /* continue with the value */
}
```

### (Experimental) `errorgantify` can turn any throwable function not throw, returning an Errorgant object instead

```typescript
function mightThrow() {
  if (Math.random() > 0.5) {
    throw new Error('ERROR_A');
  }
  return 'success';
}

const wrapped = errorgantify(mightThrow);

const value = wrapped();

if (isErrorgant(value)) {
  const theError = value.ctx;
} else {
  /* continue with the value */
}
```

## TODO

- [ ] A TypeScript playground to experience with the library
- [ ] Let user type the context of Errorgant returned by `errorgantly`
- [ ] A function returning `any` make `errorgantly`, `errorgantify` not type-safe
- [ ] `errorgantify` might not transform a generic function correctly, though I don't have an example currently
