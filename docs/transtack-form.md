# TanStack Form LLM Context

## 1. Library Overview & Philosophy

TanStack Form is a **headless**, **signal-based**, **type-safe** form state management library. It is framework-agnostic (React, Vue, Solid, Angular, Svelte) but typically consumed via adapters (e.g., `@tanstack/react-form`).

**Core Tenets:**

- **Headless:** Provides logic only (hooks/components); no UI markup/styles.
- **Inferred Types:** Types are derived from `defaultValues` at runtime. **Do not** use manual generics (e.g., `useForm<MyInterface>()`) unless absolutely necessary.
- **Signal Architecture:** Uses TanStack Store for fine-grained reactivity. Components only re-render if the specific slice of state they subscribe to changes.
- **Controlled State:** All form state is explicitly managed; `handleChange` and `value` bindings are required.

## 2. Setup & Initialization (`useForm`)

The entry point is `useForm`.

### Basic Pattern

```typescript
import { useForm } from "@tanstack/react-form";

// 1. Define shape via defaultValues (Source of Truth for Types)
const form = useForm({
  defaultValues: {
    firstName: "",
    age: 0,
    email: "",
    address: {
      street: "",
      zip: "",
    },
    hobbies: [] as string[],
  },
  // 2. Handle submission
  onSubmit: async ({ value }) => {
    // value is fully typed here automatically
    await api.post("/user", value);
  },
});
```

### Key `useForm` Options

- `defaultValues`: (Required) The initial state. Determines the shape and types.
- `onSubmit`: Async handler. Receives `{ value, formApi }`.
- `validators`: Form-level validation (e.g., cross-field validation).

## 3. Field Rendering (`form.Field`)

Fields use a **Render Prop** pattern. The direct child is a function receiving a `field` object.

### Standard Field Pattern

```typescript
<form.Field
  name="firstName" // Type-safe string path (e.g., "address.street")
  validators: {{
    onChange: ({ value }) => {
      // Form-level synchronous validation
    },
    onSubmitAsync: async ({ value }) => {
      // Server-side validation
    }
  }}
  children={(field) => (
    <div>
      <label>First Name</label>
      <input
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {/* Field Metadata Access */}
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <em className="error">{field.state.meta.errors.join(', ')}</em>
      ) : null}
    </div>
  )}
/>
```

### The `field` API Object

Inside the render prop, `field` contains:

- `field.state.value`: Current value.
- `field.handleChange(val)`: Updates value (triggers `onChange` validation).
- `field.handleBlur()`: Marks as touched (triggers `onBlur` validation).
- `field.state.meta`: Contains `isTouched`, `isDirty`, `errors`, `isValidating`.

## 4. Validation System

TanStack Form uses a **granular validation architecture**. Validation rules are defined in the `validators` prop (on `useForm` or `form.Field`). Errors are categorized by the event that triggered them (`onChange`, `onBlur`, `onSubmit`, `onMount`).

### A. Field-Level Validation

Define rules directly on `<form.Field>`. You can mix synchronous and asynchronous validators across different triggers.

```typescript
<form.Field
  name="age"
  validators={{
    // 1. Synchronous: Run on every keystroke
    onChange: ({ value }) =>
      value < 18 ? 'Must be 18+' : undefined,

    // 2. Synchronous: Run only when field loses focus
    onBlur: ({ value }) =>
      value % 2 !== 0 ? 'Must be even' : undefined,

    // 3. Asynchronous: Run on change (requires debounce)
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      const isAllowed = await checkServer(value)
      return isAllowed ? undefined : 'Not allowed'
    }
  }}
  children={(field) => (
    /* Render field... */
  )}
/>
```

### B. Schema Validation (Zod, Yup, Valibot)

TanStack Form supports "Standard Schema" libraries natively or via adapters. You can pass a schema directly to the trigger property.

```typescript
import { z } from 'zod'

// Inside form.Field
validators={{
  // Zod schema runs on change
  onChange: z.string().email('Invalid email format'),
  // Zod schema runs on blur
  onBlur: z.string().min(5, 'Too short')
}}
```

### C. Form-Level Validation (Cross-Field)

Use `validators` on `useForm` to validate relationships between fields (e.g., Password Confirmation).

```typescript
const form = useForm({
  defaultValues: { pass: "", confirm: "" },
  validators: {
    // destructured 'value' is the entire form state object
    onChange: ({ value }) => {
      if (value.pass !== value.confirm) {
        return "Passwords do not match";
      }
      return undefined;
    },
  },
});

// Access form-level errors via:
// form.state.errors (Array) or form.state.errorMap (Object)
```

### D. Displaying Errors: `errors` vs `errorMap`

The `field.state.meta` object provides two ways to read errors:

1.  **`meta.errors`**: A flat array of _all_ current errors from all triggers. Use this for general error display.

    ```typescript
    {field.state.meta.errors.length ? (
      <em role="alert">{field.state.meta.errors.join(', ')}</em>
    ) : null}
    ```

2.  **`meta.errorMap`**: An object keyed by the trigger (`onChange`, `onBlur`, etc.). Use this if you want to prioritize UI feedback (e.g., only show `onSubmit` errors at the top of the form, but show `onChange` errors inline).

### E. Validation Logic Flow

1.  **Sync First:** `onChange` (sync) runs first.
2.  **Blocking:** If sync validation fails, `onChangeAsync` **will not run**. This saves server resources.
3.  **Debounce:** Async validators obey `onChangeAsyncDebounceMs`.
4.  **Accumulation:** Errors are cumulative in `errorMap` but usually displayed as a joined list in `errors`.

## 5. Arrays & Dynamic Fields (`mode="array"`)

To manage lists, set `mode="array"` on the field.

### Array Field Pattern

```typescript
<form.Field
  name="hobbies"
  mode="array"
  children={(field) => (
    <div>
      {/* Map over the value array */}
      {field.state.value.map((_, i) => (
        <form.Field
          key={i}
          name={`hobbies[${i}]`} // Bracket notation for index
          children={(subField) => (
            <input
              value={subField.state.value}
              onChange={(e) => subField.handleChange(e.target.value)}
            />
          )}
        />
      ))}

      {/* Array Manipulation Methods */}
      <button onClick={() => field.pushValue('')}>Add</button>
      <button onClick={() => field.removeValue(field.state.value.length - 1)}>
        Remove Last
      </button>
    </div>
  )}
/>
```

**Key Array Methods:**
`pushValue(val)`, `removeValue(index)`, `insertValue(index, val)`, `swapValues(a, b)`, `moveValue(from, to)`.

## 6. Performance & Subscriptions

**CRITICAL:** TanStack Form relies on **selective subscription**.

### 1. `form.Subscribe` Component

Use this to render based on specific form-level state (e.g., submission status) without re-rendering the whole form.

```typescript
<form.Subscribe
  selector={(state) => [state.canSubmit, state.isSubmitting]}
  children={([canSubmit, isSubmitting]) => (
    <button disabled={!canSubmit || isSubmitting}>
      {isSubmitting ? 'Sending...' : 'Submit'}
    </button>
  )}
/>
```

### 2. `useStore` Hook

For accessing state outside the render loop or inside custom hooks. **Always** provide a selector.

```typescript
const isDirty = useStore(form.store, (state) => state.isDirty);
```

## 7. Common Pitfalls & Anti-Patterns

1.  **Ignoring Selectors:**
    - _Bad:_ `<form.Subscribe children={(state) => ...} />` (Subscribes to everything).
    - _Good:_ Provide `selector={(state) => [state.values.name]}`.

2.  **Manual Generics:**
    - _Bad:_ `useForm<User>()`.
    - _Good:_ `useForm({ defaultValues: userEmptyState })`. Let inference work.

3.  **Uncontrolled Inputs:**
    - _Bad:_ `<input name={field.name} />` (Missing `value` and `onChange`).
    - _Good:_ Bind `field.state.value` and `field.handleChange`.

4.  **Mutating State Directly:**
    - Never modify `form.state` directly. Use `field.handleChange`, `form.setFieldValue`, or `field.pushValue`.

5.  **Wrong Validation Timing:**
    - Don't use `onChangeAsync` without `onChangeAsyncDebounceMs` for text inputs, or you will spam your server.

## 8. Cheat Sheet: `field.state.meta`

| Property       | Description                                               |
| :------------- | :-------------------------------------------------------- |
| `isTouched`    | Field has been blurred.                                   |
| `isDirty`      | Value is different from `defaultValue`.                   |
| `errors`       | Array of current validation error messages.               |
| `isValidating` | Boolean, useful for showing spinners during async checks. |
| `isPristine`   | Opposite of `isDirty`.                                    |

### Core APIs \& State Architecture

**FormApi - Form Instance Methods**

The `FormApi` instance provides complete programmatic control over form state:

| Method            | Purpose                                | Signature                                |
| :---------------- | :------------------------------------- | :--------------------------------------- |
| `handleSubmit()`  | Triggers validation and calls onSubmit | `(e: FormEvent) => Promise<void>`        |
| `setFieldValue()` | Update specific field value            | `(name: string, value: unknown) => void` |
| `reset()`         | Reset all fields to defaultValues      | `() => void`                             |
| `validate()`      | Trigger validation across all fields   | `() => Promise<ValidationError[]>`       |
| `getFieldValue()` | Retrieve field value                   | `(name: string) => unknown`              |
| `getFieldMeta()`  | Access field metadata                  | `(name: string) => FieldMeta`            |

**Form State Object**

The `form.state` property contains the complete current form state with these key properties:

- **values**: Object matching defaultValues structure with current values
- **errors**: Array of all validation errors across all fields
- **errorMap**: Object organized by validation trigger (`onChange`, `onBlur`, `onSubmit`, etc.)
- **isValid**: Boolean indicating entire form passes validation
- **isValidating**: Boolean tracking if async validation is in progress
- **isSubmitting**: Boolean tracking form submission state
- **isSubmitted**: Boolean indicating form has been submitted at least once
- **canSubmit**: Derived boolean (true if isValid \&\& !isSubmitting)
- **fieldMeta**: Record of metadata for each field with keys matching field names

**FieldApi - Field Instance Methods**

The `FieldApi` provides granular control over individual fields:

```typescript
{
  /* Value Management */
}
field.state.value; // Current field value
field.handleChange(value); // Update field value
field.handleBlur(); // Mark field as touched/blurred

{
  /* Array-Specific Methods */
}
field.pushValue(value); // Add element to end of array
field.removeValue(index); // Delete element at index
field.insertValue(index, value); // Insert at specific position
field.swapValues(indexA, indexB); // Exchange two elements
field.moveValue(from, to); // Reposition element
field.replaceValue(index, value); // Replace element at index
field.clearValues(); // Empty entire array
```

**Field State Metadata**

The `field.state.meta` object contains validation and interaction metadata:[^5]

- **errors**: Array of error message strings from all validators
- **errorMap**: Errors keyed by validation trigger type
- **isTouched**: User has blurred field (marks field as validated)
- **isDirty**: Value differs from defaultValue (persistent)
- **isPristine**: Value matches defaultValue (inverse of isDirty)
- **isBlurred**: User has blurred field at least once
- **isValidating**: Async validation currently running
- **isValid**: Field passes all validation rules
- **isDefaultValue**: Value exactly matches original defaultValue

### Comprehensive Validation System

**Validation Timing \& Triggers**

TanStack Form provides multiple validation timing options controlling when validators execute:

| Trigger         | Timing                          | Use Case                                 |
| :-------------- | :------------------------------ | :--------------------------------------- |
| `onChange`      | Every value change              | Real-time feedback                       |
| `onBlur`        | Field loses focus               | Less intrusive validation                |
| `onSubmit`      | Form submission                 | Final validation before server           |
| `onMount`       | Field component mounts          | Initial validation state                 |
| `onChangeAsync` | Async on change (with debounce) | Server checks (username availability)    |
| `onBlurAsync`   | Async on blur                   | Server checks after user completes field |
| `onSubmitAsync` | Async before form submission    | Backend validation \& error mapping      |

**Four Validation Approaches**

TanStack Form supports multiple validation strategies allowing developers to choose the best fit:

1. **Inline Validators** - Functions returning error strings:

```typescript
validators={{
  onChange: ({ value }) =>
    value.length < 3 ? 'Minimum 3 characters' : undefined
}}
```

2. **Schema-based Validation** - Zod, Valibot, ArkType using Standard Schema:

```typescript
import { z } from 'zod'
const schema = z.object({
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+')
})
validators={{ onChange: schema }}
```

3. **Async Validation** - Server-side checks with debounce:

```typescript
validators={{
  onChangeAsync: async ({ value }) => {
    const exists = await checkEmailExists(value)
    return exists ? 'Email already registered' : undefined
  },
  onChangeAsyncDebounceMs: 500
}}
```

4. **Server Validation** - Mapping backend errors to fields:

```typescript
validators={{
  onSubmitAsync: async ({ value }) => {
    const result = await submitToServer(value)
    if (result.errors) {
      return result.errors // Map to errorMap automatically
    }
  }
}}
```

**Validation Flow \& Error Handling**

Validation follows a strict execution order ensuring efficiency:

1. Synchronous validators run first (`onChange`, `onBlur`, `onSubmit` validators)
2. Only if sync validation passes do async validators execute
3. Async validators respect debounce settings (e.g., `onChangeAsyncDebounceMs`)
4. Errors accumulate in `errorMap` keyed by trigger type
5. `form.handleSubmit()` enforces validation before calling `onSubmit`

Errors are exposed in two ways:

- **errors array**: Flat array of all error messages: `field.state.meta.errors`
- **errorMap object**: Errors keyed by validator type: `field.state.meta.errorMap.onChange`

This separation allows displaying different error messages based on validation stage (e.g., show sync errors immediately, async errors after debounce completes).

### Array Fields \& Dynamic Forms

**Mode="array" Pattern**

Array fields enable dynamic lists of items using the `mode="array"` prop on `form.Field`:

```typescript
<form.Field
  name="hobbies"
  mode="array"
  children={(field) => (
    <>
      <h3>Hobbies</h3>
      {field.state.value.map((_, index) => (
        <form.Field
          key={index}
          name={`hobbies[${index}]`}
          children={(subField) => (
            <div>
              <input
                value={subField.state.value}
                onChange={(e) => subField.handleChange(e.target.value)}
              />
              <button onClick={() => field.removeValue(index)}>Remove</button>
            </div>
          )}
        />
      ))}
      <button onClick={() => field.pushValue('')}>Add Hobby</button>
    </>
  )}
/>
```

The field name uses bracket notation (`hobbies[${index}]`) allowing TanStack Form to map values to array indices. This pattern works with both primitive arrays (strings, numbers) and arrays of objects with nested properties.

**Nested Objects in Arrays**

Arrays of objects are supported by accessing nested properties in field names

```typescript
<form.Field
  name="skills"
  mode="array"
  children={(field) => (
    <>
      {field.state.value.map((_, index) => (
        <div key={index}>
          <form.Field
            name={`skills[${index}].language`}
            children={(langField) => (
              <input value={langField.state.value}
                     onChange={(e) => langField.handleChange(e.target.value)} />
            )}
          />
          <form.Field
            name={`skills[${index}].rating`}
            children={(ratingField) => (
              <input type="number" value={ratingField.state.value}
                     onChange={(e) => ratingField.handleChange(+e.target.value)} />
            )}
          />
        </div>
      ))}
    </>
  )}
/>
```

The library automatically maintains type safety for nested properties through TypeScript's recursive type inference
