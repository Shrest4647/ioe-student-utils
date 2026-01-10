# Generators

<Callout title='warning'>
For now, specifying `arraySize` along with `isUnique` in generators that support it will result in unique values being generated (not unique arrays), which will then be packed into arrays.
</Callout>

## ---

### `default`

<rem025 />
Generates the same given value each time the generator is called.

|     | param          | default | type     |
| :-- | :------------- | :------ | :------- |
|     | `defaultValue` | --      | `any`    |
|     | `arraySize`    | --      | `number` |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  posts: {
    columns: {
      content: funcs.default({
        // value you want to generate
        defaultValue: "post content",

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `valuesFromArray`

<rem025 />
Generates values from given array

|     | param       | default                      | type                                             |
| :-- | :---------- | :--------------------------- | :----------------------------------------------- |
|     | `values`    | --                           | `any[]` \| `{ weight: number; values: any[] }[]` |
|     | `isUnique`  | `database column uniqueness` | `boolean`                                        |
|     | `arraySize` | --                           | `number`                                         |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
posts: {
columns: {
title: funcs.valuesFromArray({
// Array of values you want to generate (can be an array of weighted values)
values: ["Title1", "Title2", "Title3", "Title4", "Title5"],

        // Property that controls whether the generated values will be unique or not
        isUnique: true,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },

},
}));

````

### `intPrimaryKey`

<rem025 />
Generates sequential integers starting from 1.

|  | param      | default    | type
|:-| :--------  | :--------  | :--------
|  |--          |--          |--

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  posts: {
    columns: {
      id: funcs.intPrimaryKey(),
    },
  },
}));

````

### `number`

<rem025 />
Generates numbers with a floating point within the given range

|     | param       | default                                                                                           | type      |
| :-- | :---------- | :------------------------------------------------------------------------------------------------ | :-------- |
|     | `isUnique`  | `database column uniqueness`                                                                      | `boolean` |
|     | `precision` | `100`                                                                                             | `number`  |
|     | `maxValue`  | `` `precision * 1000` if isUnique equals false`` `` `precision * count` if isUnique equals true`` | `number`  |
|     | `minValue`  | `-maxValue`                                                                                       | `number`  |
|     | `arraySize` | --                                                                                                | `number`  |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
products: {
columns: {
unitPrice: funcs.number({
// lower border of range.
minValue: 10,

        // upper border of range.
        maxValue: 120,

        // precision of generated number:
        // precision equals 10 means that values will be accurate to one tenth (1.2, 34.6);
        // precision equals 100 means that values will be accurate to one hundredth (1.23, 34.67).
        precision: 100,

        // property that controls if generated values gonna be unique or not.
        isUnique: false,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },

},
}));

````

### `int`

<rem025 />
Generates integers within the given range

|  | param      | default                                                                            | type
|:-| :--------  | :--------                                                                          | :--------
|  |`isUnique`  |`database column uniqueness`                                                        |`boolean`
|  |`maxValue`  |``` `1000` if isUnique equals false``` ``` `count * 10` if isUnique equals true```  |`number \| bigint`
|  |`minValue`  |`-maxValue`                                                                         |`number \| bigint`
|  |`arraySize` |--                                                                                  |`number`

<rem025 />
```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  products: {
    columns: {
      unitsInStock: funcs.int({
        // lower border of range.
        minValue: 0,

        // lower border of range.
        maxValue: 100,

        // property that controls if generated values gonna be unique or not.
        isUnique: false,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));

````

### `boolean`

<rem025 />
Generates boolean values (true or false)

|     | param       | default | type     |
| :-- | :---------- | :------ | :------- |
|     | `arraySize` | --      | `number` |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
users: {
columns: {
isAvailable: funcs.boolean({
// number of elements in each one-dimensional array.
// (If specified, arrays will be generated.)
arraySize: 3
}),
},
},
}));

````

### `date`

<rem025 />
Generates a date within the given range

|  | param      | default                 | type
|:-| :--------  | :--------------         | :--------
|  |`minDate`   |`new Date('2020-05-08')` | `string \| Date`
|  |`maxDate`   |`new Date('2028-05-08')` | `string \| Date`
|  |`arraySize` |--                       |`number`

<Callout type='warning'>
If only one of the parameters (`minDate` or `maxDate`) is provided, the unspecified parameter will be calculated by adding or subtracting 8 years to/from the specified one
</Callout>

<rem025 />
```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      birthDate: funcs.date({
        // lower border of range.
        minDate: "1990-01-01",

        // upper border of range.
        maxDate: "2010-12-31",

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));

````

### `time`

<rem025 />
Generates time in 24-hour format

|     | param       | default | type     |
| :-- | :---------- | :------ | :------- |
|     | `arraySize` | --      | `number` |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
users: {
columns: {
birthTime: funcs.time({
// number of elements in each one-dimensional array.
// (If specified, arrays will be generated.)
arraySize: 3
}),
},
},
}));

````

### `timestamp`

<rem025 />
Generates timestamps

|  | param      | default    | type
|:-| :--------  | :--------  | :--------
|  |`arraySize` |--          |`number`

<rem025 />
```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  orders: {
    columns: {
      shippedDate: funcs.timestamp({
        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));

````

### `datetime`

<rem025 />
Generates datetime objects

|     | param       | default | type     |
| :-- | :---------- | :------ | :------- |
|     | `arraySize` | --      | `number` |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
orders: {
columns: {
shippedDate: funcs.datetime({
// number of elements in each one-dimensional array.
// (If specified, arrays will be generated.)
arraySize: 3
}),
},
},
}));

````

### `year`

<rem025 />
Generates years in `YYYY` format

|  | param      | default    | type
|:-| :--------  | :--------  | :--------
|  |`arraySize` |--          |`number`

<rem025 />
```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      birthYear: funcs.year({
        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));

````

### `json`

<rem025 />
Generates JSON objects with a fixed structure

```ts
{
  (email, name, isGraduated, hasJob, salary, startedWorking, visitedCountries);
}

// or

{
  (email, name, isGraduated, hasJob, visitedCountries);
}
```

> The JSON structure will be picked randomly

|     | param       | default | type     |
| :-- | :---------- | :------ | :------- |
|     | `arraySize` | --      | `number` |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
users: {
columns: {
metadata: funcs.json({
// number of elements in each one-dimensional array.
// (If specified, arrays will be generated.)
arraySize: 3
}),
},
},
}));

````

### `interval`

<rem025 />
Generates time intervals.

Example of a generated value: `1 year 12 days 5 minutes`

|  | param      | default                     | type
|:-| :--------  | :--------                   | :--------
|  |`isUnique`  |`database column uniqueness` |`boolean`
|  |`arraySize` |--                           |`number`

<rem025 />
```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      timeSpentOnWebsite: funcs.interval({
        // `isUnique` - property that controls whether the generated values will be unique or not
        isUnique: true,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));

````

### `string`

<rem025 />
Generates random strings

|     | param       | default                      | type      |
| :-- | :---------- | :--------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness` | `boolean` |
|     | `arraySize` | --                           | `number`  |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
users: {
columns: {
hashedPassword: funcs.string({
// `isUnique` - property that controls whether the generated values will be unique or not
isUnique: false,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },

},
}));

````

### `uuid`

<rem025 />
Generates v4 UUID strings

|  | param      | default    | type
|:-| :--------  | :--------  | :--------
|  |`arraySize` |--          |`number`

<rem025 />
```ts
import { seed } from "drizzle-seed";
await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  products: {
    columns: {
      id: funcs.uuid({
        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));
````

### `firstName`

<rem025 />
Generates a person's first name

|     | param       | default                      | type      |
| :-- | :---------- | :--------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness` | `boolean` |
|     | `arraySize` | --                           | `number`  |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
users: {
columns: {
firstName: funcs.firstName({
// `isUnique` - property that controls whether the generated values will be unique or not
isUnique: true,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },

},
}));

````

### `lastName`

<rem025 />
Generates a person's last name

|  | param      | default                     | type
|:-| :--------  | :--------                   | :--------
|  |`isUnique`  |`database column uniqueness` |`boolean`
|  |`arraySize` |--                           |`number`

<rem025 />
```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      lastName: funcs.lastName({
        // `isUnique` - property that controls whether the generated values will be unique or not
        isUnique: false,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));

````

### `fullName`

<rem025 />
Generates a person's full name

|     | param       | default                      | type      |
| :-- | :---------- | :--------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness` | `boolean` |
|     | `arraySize` | --                           | `number`  |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
users: {
columns: {
fullName: funcs.fullName({
// `isUnique` - property that controls whether the generated values will be unique or not
isUnique: true,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },

},
}));

````

### `email`

<rem025 />
Generates unique email addresses

|  | param      | default    | type
|:-| :--------  | :--------  | :--------
|  |`arraySize` |--          |`number`

<rem025 />
```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      email: funcs.email({
        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));

````

### `phoneNumber`

<rem025 />
Generates unique phone numbers

|     | param                    | default                                                                                                                     | type                 |
| :-- | :----------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :------------------- |
|     | `template`               | --                                                                                                                          | `string`             |
|     | `prefixes`               | [Used dataset for prefixes](https://github.com/OleksiiKH0240/drizzle-orm/blob/main/drizzle-seed/src/datasets/phonesInfo.ts) | `string[]`           |
|     | `generatedDigitsNumbers` | `7` - `if prefixes was defined`                                                                                             | `number \| number[]` |
|     | `arraySize`              | --                                                                                                                          | `number`             |

<rem025 />
```ts 
import { seed } from "drizzle-seed";

//generate phone number using template property
await seed(db, schema, { count: 1000 }).refine((funcs) => ({
users: {
columns: {
phoneNumber: funcs.phoneNumber({
// `template` - phone number template, where all '#' symbols will be substituted with generated digits.
template: "+(380) ###-####",

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },

},
}));

````
```ts
import { seed } from "drizzle-seed";

//generate phone number using prefixes and generatedDigitsNumbers properties
await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      phoneNumber: funcs.phoneNumber({
        // `prefixes` - array of any string you want to be your phone number prefixes.(not compatible with `template` property)
        prefixes: ["+380 99", "+380 67"],

        // `generatedDigitsNumbers` - number of digits that will be added at the end of prefixes.(not compatible with `template` property)
        generatedDigitsNumbers: 7,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3
      }),
    },
  },
}));

````

```ts
import { seed } from "drizzle-seed";

// generate phone number using prefixes and generatedDigitsNumbers properties but with different generatedDigitsNumbers for prefixes
await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      phoneNumber: funcs.phoneNumber({
        // `prefixes` - array of any string you want to be your phone number prefixes.(not compatible with `template` property)
        prefixes: ["+380 99", "+380 67", "+1"],

        // `generatedDigitsNumbers` - number of digits that will be added at the end of prefixes.(not compatible with `template` property)
        generatedDigitsNumbers: [7, 7, 10],

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `country`

<rem025 />
Generates country's names

|     | param       | default                      | type      |
| :-- | :---------- | :--------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness` | `boolean` |
|     | `arraySize` | --                           | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      country: funcs.country({
        // `isUnique` - property that controls whether the generated values will be unique or not
        isUnique: false,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `city`

<rem025 />
Generates city's names

|     | param       | default                      | type      |
| :-- | :---------- | :--------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness` | `boolean` |
|     | `arraySize` | --                           | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      city: funcs.city({
        // `isUnique` - property that controls whether the generated values will be unique or not
        isUnique: false,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `streetAddress`

<rem025 />
Generates street address

|     | param       | default                      | type      |
| :-- | :---------- | :--------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness` | `boolean` |
|     | `arraySize` | --                           | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      streetAddress: funcs.streetAddress({
        // `isUnique` - property that controls whether the generated values will be unique or not
        isUnique: false,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `jobTitle`

<rem025 />
Generates job titles

|     | param       | default | type     |
| :-- | :---------- | :------ | :------- |
|     | `arraySize` | --      | `number` |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      jobTitle: funcs.jobTitle({
        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `postcode`

<rem025 />
Generates postal codes

|     | param       | default                      | type      |
| :-- | :---------- | :--------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness` | `boolean` |
|     | `arraySize` | --                           | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      postcode: funcs.postcode({
        // `isUnique` - property that controls whether the generated values will be unique or not
        isUnique: true,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `state`

<rem025 />
Generates US states

|     | param       | default | type     |
| :-- | :---------- | :------ | :------- |
|     | `arraySize` | --      | `number` |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      state: funcs.state({
        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `companyName`

<rem025 />
Generates random company's names

|     | param       | default                      | type      |
| :-- | :---------- | :--------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness` | `boolean` |
|     | `arraySize` | --                           | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  users: {
    columns: {
      company: funcs.companyName({
        // `isUnique` - property that controls whether the generated values will be unique or not
        isUnique: true,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `loremIpsum`

<rem025 />
Generates `lorem ipsum` text sentences.

|     | param            | default | type     |
| :-- | :--------------- | :------ | :------- |
|     | `sentencesCount` | 1       | `number` |
|     | `arraySize`      | --      | `number` |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  posts: {
    columns: {
      content: funcs.loremIpsum({
        // `sentencesCount` - number of sentences you want to generate as one generated value(string).
        sentencesCount: 2,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `point`

<rem025 />
Generates 2D points within specified ranges for x and y coordinates.

|     | param       | default                                                                             | type      |
| :-- | :---------- | :---------------------------------------------------------------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness`                                                        | `boolean` |
|     | `maxXValue` | `` `10 * 1000` if isUnique equals false`` `` `10 * count` if isUnique equals true`` | `number`  |
|     | `minXValue` | `-maxXValue`                                                                        | `number`  |
|     | `maxYValue` | `` `10 * 1000` if isUnique equals false`` `` `10 * count` if isUnique equals true`` | `number`  |
|     | `minYValue` | `-maxYValue`                                                                        | `number`  |
|     | `arraySize` | --                                                                                  | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  triangles: {
    columns: {
      pointCoords: funcs.point({
        // `isUnique` - property that controls if generated values gonna be unique or not.
        isUnique: true,

        // `minXValue` - lower bound of range for x coordinate.
        minXValue: -5,

        // `maxXValue` - upper bound of range for x coordinate.
        maxXValue: 20,

        // `minYValue` - lower bound of range for y coordinate.
        minYValue: 0,

        // `maxYValue` - upper bound of range for y coordinate.
        maxYValue: 30,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `line`

<rem025 />
Generates 2D lines within specified ranges for a, b and c parameters of line.

```
line equation: a*x + b*y + c = 0
```

|     | param       | default                                                                             | type      |
| :-- | :---------- | :---------------------------------------------------------------------------------- | :-------- |
|     | `isUnique`  | `database column uniqueness`                                                        | `boolean` |
|     | `maxAValue` | `` `10 * 1000` if isUnique equals false`` `` `10 * count` if isUnique equals true`` | `number`  |
|     | `minAValue` | `-maxAValue`                                                                        | `number`  |
|     | `maxBValue` | `` `10 * 1000` if isUnique equals false`` `` `10 * count` if isUnique equals true`` | `number`  |
|     | `minBValue` | `-maxBValue`                                                                        | `number`  |
|     | `maxCValue` | `` `10 * 1000` if isUnique equals false`` `` `10 * count` if isUnique equals true`` | `number`  |
|     | `minCValue` | `-maxCValue`                                                                        | `number`  |
|     | `arraySize` | --                                                                                  | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  lines: {
    columns: {
      lineParams: funcs.point({
        // `isUnique` - property that controls if generated values gonna be unique or not.
        isUnique: true,

        // `minAValue` - lower bound of range for a parameter.
        minAValue: -5,

        // `maxAValue` - upper bound of range for x parameter.
        maxAValue: 20,

        // `minBValue` - lower bound of range for y parameter.
        minBValue: 0,

        // `maxBValue` - upper bound of range for y parameter.
        maxBValue: 30,

        // `minCValue` - lower bound of range for y parameter.
        minCValue: 0,

        // `maxCValue` - upper bound of range for y parameter.
        maxCValue: 10,

        // number of elements in each one-dimensional array.
        // (If specified, arrays will be generated.)
        arraySize: 3,
      }),
    },
  },
}));
```

### `bitString`

<rem025 />
Generates bit strings based on specified parameters.

|     | param        | default                      | type      |
| :-- | :----------- | :--------------------------- | :-------- |
|     | `isUnique`   | `database column uniqueness` | `boolean` |
|     | `dimensions` | `database column bit-length` | `number`  |
|     | `arraySize`  | --                           | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  bitStringTable: {
    columns: {
      bit: funcs.bitString({
        // desired length of each bit string (e.g., `dimensions = 3` produces values like `'010'`).
        dimensions: 12,

        // property that controls if generated values gonna be unique or not;
        isUnique: true,

        // number of elements in each one-dimensional array (If specified, arrays will be generated);
        arraySize: 3,
      }),
    },
  },
}));
```

### `inet`

<rem025 />
Generates ip addresses based on specified parameters.

|     | param         | default                      | type               |
| :-- | :------------ | :--------------------------- | :----------------- |
|     | `isUnique`    | `database column uniqueness` | `boolean`          |
|     | `arraySize`   | --                           | `number`           |
|     | `ipAddress`   | `'ipv4'`                     | `'ipv4' \| 'ipv6'` |
|     | `includeCidr` | `true`                       | `boolean`          |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  inetTable: {
    columns: {
      inet: funcs.inet({
        // property that controls if generated values gonna be unique or not;
        isUnique: true,

        // number of elements in each one-dimensional array (If specified, arrays will be generated);
        arraySize: 3,

        // type of IP address to generate — either "ipv4" or "ipv6";
        ipAddress: "ipv4",

        // determines whether generated IPs include a CIDR suffix.
        includeCidr: true,
      }),
    },
  },
}));
```

### `geometry`

<rem025 />
Generates geometry objects based on the given parameters.

<Callout title='warnings'>
<Tabs items={['arraySize', 'srid']}>
<Tab>
Currently, if you set arraySize to a value greater than 1 
or try to insert more than one `geometry point` element into a `geometry(point, 0)[]` column in PostgreSQL or CockroachDB via drizzle-orm, 
you’ll encounter an error.

This bug is already in the backlog.

<Callout title="❌">
```ts {13}
import { seed } from "drizzle-seed";
import { geometry, pgTable } from 'drizzle-orm/pg-core';

const geometryTable = pgTable('geometry_table', {
geometryArray: geometry('geometry_array', { type: 'point', srid: 0 }).array(3),
});

await seed(db, { geometryTable }, { count: 1000 }).refine((funcs) => ({
geometryTable: {
columns: {
geometryArray: funcs.geometry({
// currently arraySize with values > 1 are not supported
arraySize: 3,
}),
},
},
}));

````
</Callout>

<Callout title='✅'>
```ts {13}
import { seed } from "drizzle-seed";
import { geometry, pgTable } from 'drizzle-orm/pg-core';

const geometryTable = pgTable('geometry_table', {
    geometryArray: geometry('geometry_array', { type: 'point', srid: 0 }).array(1),
});

await seed(db, { geometryTable }, { count: 1000 }).refine((funcs) => ({
  geometryTable: {
    columns: {
      geometryArray: funcs.geometry({
        // will work as expected
        arraySize: 1,
      }),
    },
  },
}));
````

</Callout>
</Tab>

<Tab>
Currently, if you set the SRID of a `geometry(point)` column to anything other than 0 (for example, 4326) in your drizzle-orm table declaration, 
you’ll encounter an error during the seeding process.

This bug is already in the backlog.

<Callout title="❌">
```ts {5}
import { seed } from "drizzle-seed";
import { geometry, pgTable } from 'drizzle-orm/pg-core';

const geometryTable = pgTable('geometry_table', {
geometryColumn: geometry('geometry_column', { type: 'point', srid: 4326 }),
});

await seed(db, { geometryTable }, { count: 1000 }).refine((funcs) => ({
geometryTable: {
columns: {
geometryColumn: funcs.geometry({
srid: 4326,
}),
},
},
}));

````
</Callout>

<Callout title='✅'>
```ts {5}
import { seed } from "drizzle-seed";
import { geometry, pgTable } from 'drizzle-orm/pg-core';

const geometryTable = pgTable('geometry_table', {
    geometryColumn: geometry('geometry_column', { type: 'point', srid: 0 }),
});

await seed(db, { geometryTable }, { count: 1000 }).refine((funcs) => ({
  geometryTable: {
    columns: {
      geometryColumn: funcs.geometry({
        srid: 4326,
      }),
    },
  },
}));
````

</Callout>
</Tab>
</Tabs>
</Callout>

|     | param           | default                      | type                              |
| :-- | :-------------- | :--------------------------- | :-------------------------------- |
|     | `isUnique`      | `database column uniqueness` | `boolean`                         |
|     | `arraySize`     | --                           | `number`                          |
|     | `type`          | `'point'`                    | `'point'`                         |
|     | `srid`          | `4326`                       | `4326 \| 3857`                    |
|     | `decimalPlaces` | `6`                          | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 7` |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  geometryTable: {
    columns: {
      geometryPointTuple: funcs.geometry({
        // property that controls if generated values gonna be unique or not;
        isUnique: true,

        // number of elements in each one-dimensional array (If specified, arrays will be generated);
        arraySize: 1,

        // geometry type to generate; currently only `'point'` is supported;
        type: "point",

        // Spatial Reference System Identifier: determines what type of point will be generated - either `4326` or `3857`;
        srid: 4326,

        // number of decimal places for points when `srid` is `4326` (e.g., `decimalPlaces = 3` produces values like `'point(30.723 46.482)'`).
        decimalPlaces: 5,
      }),
    },
  },
}));
```

### `vector`

<rem025 />
Generates vectors based on the provided parameters.

|     | param           | default                        | type      |
| :-- | :-------------- | :----------------------------- | :-------- |
|     | `isUnique`      | `database column uniqueness`   | `boolean` |
|     | `arraySize`     | --                             | `number`  |
|     | `decimalPlaces` | `2`                            | `number`  |
|     | `dimensions`    | `database column’s dimensions` | `number`  |
|     | `minValue`      | `-1000`                        | `number`  |
|     | `maxValue`      | `1000`                         | `number`  |

<rem025 />

```ts
import { seed } from "drizzle-seed";

await seed(db, schema, { count: 1000 }).refine((funcs) => ({
  vectorTable: {
    columns: {
      vector: funcs.vector({
        // property that controls if generated values gonna be unique or not;
        isUnique: true,

        // number of elements in each one-dimensional array (If specified, arrays will be generated);
        arraySize: 3,

        // number of decimal places for each vector element (e.g., `decimalPlaces = 3` produces values like `1.123`);
        decimalPlaces: 5,

        // number of elements in each generated vector (e.g., `dimensions = 3` produces values like `[1,2,3]`);
        dimensions: 12,

        // minimum allowed value for each vector element;
        minValue: -100,

        // maximum allowed value for each vector element.
        maxValue: 100,
      }),
    },
  },
}));
```

Source: https://orm.drizzle.team/docs/seed-limitations

// type limitations for third param

Source: https://orm.drizzle.team/docs/seed-overview

import Npm from "@mdx/Npm.astro";
import Tab from "@mdx/Tab.astro";
import Tabs from "@mdx/Tabs.astro";
import Callout from '@mdx/Callout.astro';
import CodeTabs from "@mdx/CodeTabs.astro";
import Section from "@mdx/Section.astro";
import IsSupportedChipGroup from '@mdx/IsSupportedChipGroup.astro';

# Drizzle Seed

<IsSupportedChipGroup chips={{ 'PostgreSQL': true, 'SQLite': true, 'MySQL': true, 'SingleStore': true, 'CockroachDB': true, 'MS SQL': true }} />

<Callout type='warning'>
  `drizzle-seed` can only be used with `drizzle-orm@0.36.4` or higher. Versions lower than this may work at runtime but could have type issues and identity column issues, as this patch was introduced in `drizzle-orm@0.36.4`
</Callout>

`drizzle-seed` is a TypeScript library that helps you generate deterministic, yet realistic,
fake data to populate your database. By leveraging a seedable pseudorandom number generator (pRNG),
it ensures that the data you generate is consistent and reproducible across different runs.
This is especially useful for testing, development, and debugging purposes.

#### What is Deterministic Data Generation?

Deterministic data generation means that the same input will always produce the same output.
In the context of `drizzle-seed`, when you initialize the library with the same seed number,
it will generate the same sequence of fake data every time. This allows for predictable and repeatable data sets.

#### Pseudorandom Number Generator (pRNG)

A pseudorandom number generator is an algorithm that produces a sequence of numbers
that approximates the properties of random numbers. However, because it's based on an initial value
called a seed, you can control its randomness. By using the same seed, the pRNG will produce the
same sequence of numbers, making your data generation process reproducible.

#### Benefits of Using a pRNG:

- Consistency: Ensures that your tests run on the same data every time.
- Debugging: Makes it easier to reproduce and fix bugs by providing a consistent data set.
- Collaboration: Team members can share seed numbers to work with the same data sets.

With drizzle-seed, you get the best of both worlds: the ability to generate realistic fake data and the control to reproduce it whenever needed.

## Installation

<Npm>drizzle-seed</Npm>

## Basic Usage

In this example we will create 10 users with random names and ids

```ts {12}
import { pgTable, integer, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";

const users = pgTable("users", {
  id: integer().primaryKey(),
  name: text().notNull(),
});

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  await seed(db, { users });
}

main();
```

## Options

**`count`**

By default, the `seed` function will create 10 entities.
However, if you need more for your tests, you can specify this in the seed options object

```ts
await seed(db, schema, { count: 1000 });
```

**`seed`**

If you need a seed to generate a different set of values for all subsequent runs, you can define a different number
in the `seed` option. Any new number will generate a unique set of values

```ts
await seed(db, schema, { seed: 12345 });
```

## Reset database

With `drizzle-seed`, you can easily reset your database and seed it with new values, for example, in your test suites

```ts
// path to a file with schema you want to reset
import * as schema from "./schema.ts";
import { reset } from "drizzle-seed";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  await reset(db, schema);
}

main();
```

Different dialects will have different strategies for database resetting

<Tabs items={['PostgreSQL', 'MySQL', 'SQLite', 'SingleStore', 'CockroachDB', 'MS SQL']}>
<Tab>
For PostgreSQL, the `drizzle-seed` package will generate `TRUNCATE` statements with the `CASCADE` option to
ensure that all tables are empty after running the reset function

```sql
TRUNCATE tableName1, tableName2, ... CASCADE;
```

</Tab>
<Tab>
For MySQL, the `drizzle-seed` package will first disable `FOREIGN_KEY_CHECKS` to ensure the next step won't fail, and then 
generate `TRUNCATE` statements to empty the content of all tables

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE tableName1;
TRUNCATE tableName2;
...
SET FOREIGN_KEY_CHECKS = 1;
```

</Tab>
<Tab>
For SQLite, the `drizzle-seed` package will first disable the `foreign_keys` pragma to ensure the next step won't fail, 
and then generate `DELETE FROM` statements to empty the content of all tables

```sql
PRAGMA foreign_keys = OFF;
DELETE FROM tableName1;
DELETE FROM tableName2;
...
PRAGMA foreign_keys = ON;
```

</Tab>
<Tab>
For SingleStore, the `drizzle-seed` package will first disable `FOREIGN_KEY_CHECKS` to ensure the next step won't fail, and then 
generate `TRUNCATE` statements to empty the content of all tables

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE tableName1;
TRUNCATE tableName2;
...
SET FOREIGN_KEY_CHECKS = 1;
```

</Tab>
<Tab>
For CockroachDB, the `drizzle-seed` package will generate `TRUNCATE` statements with the `CASCADE` option to 
ensure that all tables are empty after running the reset function

```sql
TRUNCATE tableName1, tableName2, ... CASCADE;
```

</Tab>
<Tab>
For MS SQL, the `drizzle-seed` package first gathers information about all foreign key constraints that reference 
or are contained in the tables specified as the second argument(your schema) to the `reset` function.

It then iterates over those tables, drops all foreign key constraints related to each table, and truncates each table.

Finally, the package recreates the original foreign key constraints for each table.

```sql
-- gather information about all fk constraints

-- drops all fk constraints related to each table
ALTER TABLE [<schemaName>].[<tableName>] DROP CONSTRAINT [<fkName>];

-- truncates each table
TRUNCATE TABLE [<schemaName>].[<tableName>];

-- recreates the original fk constraints
ALTER TABLE [<schemaName>].[<tableName>]
ADD CONSTRAINT [<fkName>]
FOREIGN KEY([<columnName>])
REFERENCES [<refSchemaName>].[<refTableName>] ([<refColumnName>])
ON DELETE <onDeleteAction>
ON UPDATE <onUpdateAction>;
```

</Tab>
</Tabs>

## Refinements

In case you need to change the behavior of the seed generator functions that `drizzle-seed` uses by default, you can specify your own implementation and even use your own list of values for the seeding process

`.refine` is a callback that receives a list of all available generator functions from `drizzle-seed`. It should return an object with keys representing the tables you want to refine, defining their behavior as needed.
Each table can specify several properties to simplify seeding your database:

<rem025 />

- `columns`: Refine the default behavior of each column by specifying the required generator function.
- `count`: Specify the number of rows to insert into the database. By default, it's 10. If a global count is defined in the `seed()` options, the count defined here will override it for this specific table.
- `with`: Define how many referenced entities to create for each parent table if you want to generate associated entities.

<Callout title='info'>
You can also specify a weighted random distribution for the number of referenced values you want to create. For details on this API, you can refer to [Weighted Random docs](#weighted-random) docs section
</Callout>

**API**

```ts
await seed(db, schema).refine((f) => ({
  users: {
    columns: {},
    count: 10,
    with: {
      posts: 10,
    },
  },
}));
```

Let's check a few examples with an explanation of what will happen:

```ts filename='schema.ts'
import { pgTable, integer, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer().primaryKey(),
  name: text().notNull(),
});

export const posts = pgTable("posts", {
  id: integer().primaryKey(),
  description: text(),
  userId: integer().references(() => users.id),
});
```

**Example 1**: Seed only the `users` table with 20 entities and with refined seed logic for the `name` column

```ts filename='index.ts'
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import * as schema from "./schema.ts";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);

  await seed(db, { users: schema.users }).refine((f) => ({
    users: {
      columns: {
        name: f.fullName(),
      },
      count: 20,
    },
  }));
}

main();
```

**Example 2**: Seed the `users` table with 20 entities and add 10 `posts` for each `user` by seeding the `posts` table and creating a reference from `posts` to `users`

```ts filename='index.ts'
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import * as schema from "./schema.ts";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);

  await seed(db, schema).refine((f) => ({
    users: {
      count: 20,
      with: {
        posts: 10,
      },
    },
  }));
}

main();
```

**Example 3**: Seed the `users` table with 5 entities and populate the database with 100 `posts` without connecting them to the `users` entities. Refine `id` generation for `users` so
that it will give any int from `10000` to `20000` and remains unique, and refine `posts` to retrieve values from a self-defined array

```ts filename='index.ts'
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import * as schema from "./schema.ts";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);

  await seed(db, schema).refine((f) => ({
    users: {
      count: 5,
      columns: {
        id: f.int({
          minValue: 10000,
          maxValue: 20000,
          isUnique: true,
        }),
      },
    },
    posts: {
      count: 100,
      columns: {
        description: f.valuesFromArray({
          values: [
            "The sun set behind the mountains, painting the sky in hues of orange and purple",
            "I can't believe how good this homemade pizza turned out!",
            "Sometimes, all you need is a good book and a quiet corner.",
            "Who else thinks rainy days are perfect for binge-watching old movies?",
            "Tried a new hiking trail today and found the most amazing waterfall!",
            // ...
          ],
        }),
      },
    },
  }));
}

main();
```

<Callout type='warning'>
There are many more possibilities that we will define in these docs, but for now, you can explore a few sections in this documentation. Check the [Generators](/docs/seed-functions) section to get familiar with all the available generator functions you can use.

A particularly great feature is the ability to use weighted randomization, both for generator values created for a column and for determining the number of related entities that can be generated by `drizzle-seed`.

Please check [Weighted Random docs](#weighted-random) for more info.
</Callout>

## Weighted Random

There may be cases where you need to use multiple datasets with a different priority that should be inserted into your database during the seed stage. For such cases, drizzle-seed provides an API called weighted random

The Drizzle Seed package has a few places where weighted random can be used:

- Columns inside each table refinements
- The `with` property, determining the amount of related entities to be created

Let's check an example for both:

```ts filename="schema.ts"
import {
  pgTable,
  integer,
  text,
  varchar,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: integer().primaryKey(),
  name: text().notNull(),
  quantityPerUnit: varchar().notNull(),
  unitPrice: doublePrecision().notNull(),
  unitsInStock: integer().notNull(),
  unitsOnOrder: integer().notNull(),
  reorderLevel: integer().notNull(),
  discontinued: integer().notNull(),
});

export const details = pgTable("details", {
  unitPrice: doublePrecision().notNull(),
  quantity: integer().notNull(),
  discount: doublePrecision().notNull(),

  orderId: integer()
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
});
```

**Example 1**: Refine the `unitPrice` generation logic to generate `5000` random prices, with a 30% chance of prices between 10-100 and a 70% chance of prices between 100-300

```ts filename="index.ts"
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import * as schema from "./schema.ts";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);

  await seed(db, schema).refine((f) => ({
    orders: {
      count: 5000,
      columns: {
        unitPrice: f.weightedRandom([
          {
            weight: 0.3,
            value: funcs.int({ minValue: 10, maxValue: 100 }),
          },
          {
            weight: 0.7,
            value: funcs.number({
              minValue: 100,
              maxValue: 300,
              precision: 100,
            }),
          },
        ]),
      },
    },
  }));
}

main();
```

**Example 2**: For each order, generate 1 to 3 details with a 60% chance, 5 to 7 details with a 30% chance, and 8 to 10 details with a 10% chance

```ts filename="index.ts"
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import * as schema from "./schema.ts";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);

  await seed(db, schema).refine((f) => ({
    orders: {
      with: {
        details: [
          { weight: 0.6, count: [1, 2, 3] },
          { weight: 0.3, count: [5, 6, 7] },
          { weight: 0.1, count: [8, 9, 10] },
        ],
      },
    },
  }));
}

main();
```

## Complex example

<CodeTabs items={["main.ts", "schema.ts"]}>

<Section>
```ts
import { seed } from "drizzle-seed";
import * as schema from "./schema.ts";

const main = async () => {
const titlesOfCourtesy = ["Ms.", "Mrs.", "Dr."];
const unitsOnOrders = [0, 10, 20, 30, 50, 60, 70, 80, 100];
const reorderLevels = [0, 5, 10, 15, 20, 25, 30];
const quantityPerUnit = [
"100 - 100 g pieces",
"100 - 250 g bags",
"10 - 200 g glasses",
"10 - 4 oz boxes",
"10 - 500 g pkgs.",
"10 - 500 g pkgs."
];
const discounts = [0.05, 0.15, 0.2, 0.25];

    await seed(db, schema).refine((funcs) => ({
        customers: {
            count: 10000,
            columns: {
                companyName: funcs.companyName(),
                contactName: funcs.fullName(),
                contactTitle: funcs.jobTitle(),
                address: funcs.streetAddress(),
                city: funcs.city(),
                postalCode: funcs.postcode(),
                region: funcs.state(),
                country: funcs.country(),
                phone: funcs.phoneNumber({ template: "(###) ###-####" }),
                fax: funcs.phoneNumber({ template: "(###) ###-####" })
            }
        },
        employees: {
            count: 200,
            columns: {
                firstName: funcs.firstName(),
                lastName: funcs.lastName(),
                title: funcs.jobTitle(),
                titleOfCourtesy: funcs.valuesFromArray({ values: titlesOfCourtesy }),
                birthDate: funcs.date({ minDate: "2010-12-31", maxDate: "2010-12-31" }),
                hireDate: funcs.date({ minDate: "2010-12-31", maxDate: "2024-08-26" }),
                address: funcs.streetAddress(),
                city: funcs.city(),
                postalCode: funcs.postcode(),
                country: funcs.country(),
                homePhone: funcs.phoneNumber({ template: "(###) ###-####" }),
                extension: funcs.int({ minValue: 428, maxValue: 5467 }),
                notes: funcs.loremIpsum()
            }
        },
        orders: {
            count: 50000,
            columns: {
                shipVia: funcs.int({ minValue: 1, maxValue: 3 }),
                freight: funcs.number({ minValue: 0, maxValue: 1000, precision: 100 }),
                shipName: funcs.streetAddress(),
                shipCity: funcs.city(),
                shipRegion: funcs.state(),
                shipPostalCode: funcs.postcode(),
                shipCountry: funcs.country()
            },
            with: {
                details:
                    [
                        { weight: 0.6, count: [1, 2, 3, 4] },
                        { weight: 0.2, count: [5, 6, 7, 8, 9, 10] },
                        { weight: 0.15, count: [11, 12, 13, 14, 15, 16, 17] },
                        { weight: 0.05, count: [18, 19, 20, 21, 22, 23, 24, 25] },
                    ]
            }
        },
        suppliers: {
            count: 1000,
            columns: {
                companyName: funcs.companyName(),
                contactName: funcs.fullName(),
                contactTitle: funcs.jobTitle(),
                address: funcs.streetAddress(),
                city: funcs.city(),
                postalCode: funcs.postcode(),
                region: funcs.state(),
                country: funcs.country(),
                phone: funcs.phoneNumber({ template: "(###) ###-####" })
            }
        },
        products: {
            count: 5000,
            columns: {
                name: funcs.companyName(),
                quantityPerUnit: funcs.valuesFromArray({ values: quantityPerUnit }),
                unitPrice: funcs.weightedRandom(
                    [
                        {
                            weight: 0.5,
                            value: funcs.int({ minValue: 3, maxValue: 300 })
                        },
                        {
                            weight: 0.5,
                            value: funcs.number({ minValue: 3, maxValue: 300, precision: 100 })
                        }
                    ]
                ),
                unitsInStock: funcs.int({ minValue: 0, maxValue: 125 }),
                unitsOnOrder: funcs.valuesFromArray({ values: unitsOnOrders }),
                reorderLevel: funcs.valuesFromArray({ values: reorderLevels }),
                discontinued: funcs.int({ minValue: 0, maxValue: 1 })
            }
        },
        details: {
            columns: {
                unitPrice: funcs.number({ minValue: 10, maxValue: 130 }),
                quantity: funcs.int({ minValue: 1, maxValue: 130 }),
                discount: funcs.weightedRandom(
                    [
                        { weight: 0.5, value: funcs.valuesFromArray({ values: discounts }) },
                        { weight: 0.5, value: funcs.default({ defaultValue: 0 }) }
                    ]
                )
            }
        }
    }));

}

main();

````
</Section>
<Section>
```ts
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { integer, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const customers = pgTable('customer', {
    id: varchar({ length: 256 }).primaryKey(),
    companyName: text().notNull(),
    contactName: text().notNull(),
    contactTitle: text().notNull(),
    address: text().notNull(),
    city: text().notNull(),
    postalCode: text(),
    region: text(),
    country: text().notNull(),
    phone: text().notNull(),
    fax: text(),
});

export const employees = pgTable(
    'employee',
    {
        id: integer().primaryKey(),
        lastName: text().notNull(),
        firstName: text(),
        title: text().notNull(),
        titleOfCourtesy: text().notNull(),
        birthDate: timestamp().notNull(),
        hireDate: timestamp().notNull(),
        address: text().notNull(),
        city: text().notNull(),
        postalCode: text().notNull(),
        country: text().notNull(),
        homePhone: text().notNull(),
        extension: integer().notNull(),
        notes: text().notNull(),
        reportsTo: integer().references((): AnyPgColumn => employees.id),
        photoPath: text(),
    },
);

export const orders = pgTable('order', {
    id: integer().primaryKey(),
    orderDate: timestamp().notNull(),
    requiredDate: timestamp().notNull(),
    shippedDate: timestamp(),
    shipVia: integer().notNull(),
    freight: numeric().notNull(),
    shipName: text().notNull(),
    shipCity: text().notNull(),
    shipRegion: text(),
    shipPostalCode: text(),
    shipCountry: text().notNull(),

    customerId: text().notNull().references(() => customers.id, { onDelete: 'cascade' }),

    employeeId: integer().notNull().references(() => employees.id, { onDelete: 'cascade' }),
});

export const suppliers = pgTable('supplier', {
    id: integer().primaryKey(),
    companyName: text().notNull(),
    contactName: text().notNull(),
    contactTitle: text().notNull(),
    address: text().notNull(),
    city: text().notNull(),
    region: text(),
    postalCode: text().notNull(),
    country: text().notNull(),
    phone: text().notNull(),
});

export const products = pgTable('product', {
    id: integer().primaryKey(),
    name: text().notNull(),
    quantityPerUnit: text().notNull(),
    unitPrice: numeric().notNull(),
    unitsInStock: integer().notNull(),
    unitsOnOrder: integer().notNull(),
    reorderLevel: integer().notNull(),
    discontinued: integer().notNull(),

    supplierId: integer().notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
});

export const details = pgTable('order_detail', {
    unitPrice: numeric().notNull(),
    quantity: integer().notNull(),
    discount: numeric().notNull(),

    orderId: integer().notNull().references(() => orders.id, { onDelete: 'cascade' }),

    productId: integer().notNull().references(() => products.id, { onDelete: 'cascade' }),
});

````

</Section>
</CodeTabs>

## Limitations

#### Types limitations for `with`

Due to certain TypeScript limitations and the current API in Drizzle, it is not possible to properly infer references between tables, especially when circular dependencies between tables exist.

This means the `with` option will display all tables in the schema, and you will need to manually select the one that has a one-to-many relationship

<Callout title='warning'>
The `with` option works for one-to-many relationships. For example, if you have one `user` and many `posts`, you can use users `with` posts, but you cannot use posts `with` users
</Callout>

#### Type limitations for the third parameter in Drizzle tables:

Currently, we do not have type support for the third parameter in Drizzle tables. While it will work at runtime, it will not function correctly at the type level
