# Generators

Warning: Specifying `arraySize` along with `isUnique` results in unique values packed into arrays.

## default

Generates the same value each time.

- `defaultValue`: any
- `arraySize`: number

```ts
funcs.default({ defaultValue: "post content", arraySize: 3 });
```

## valuesFromArray

Generates values from array.

- `values`: any[] | weighted
- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.valuesFromArray({
  values: ["Title1", "Title2"],
  isUnique: true,
  arraySize: 3,
});
```

## intPrimaryKey

Generates sequential integers from 1.

```ts
funcs.intPrimaryKey();
```

## number

Generates floats within range.

- `isUnique`: boolean
- `precision`: number (default 100)
- `maxValue`: number
- `minValue`: number
- `arraySize`: number

```ts
funcs.number({
  minValue: 10,
  maxValue: 120,
  precision: 100,
  isUnique: false,
  arraySize: 3,
});
```

## int

Generates integers within range.

- `isUnique`: boolean
- `maxValue`: number
- `minValue`: number
- `arraySize`: number

```ts
funcs.int({ minValue: 0, maxValue: 100, isUnique: false, arraySize: 3 });
```

## boolean

Generates true/false.

- `arraySize`: number

```ts
funcs.boolean({ arraySize: 3 });
```

## date

Generates date within range.

- `minDate`: string | Date (default '2020-05-08')
- `maxDate`: string | Date (default '2028-05-08')
- `arraySize`: number

Warning: If one date missing, calculated by adding/subtracting 8 years.

```ts
funcs.date({ minDate: "1990-01-01", maxDate: "2010-12-31", arraySize: 3 });
```

## time

Generates time in 24-hour format.

- `arraySize`: number

```ts
funcs.time({ arraySize: 3 });
```

## timestamp

Generates timestamps.

- `arraySize`: number

```ts
funcs.timestamp({ arraySize: 3 });
```

## datetime

Generates datetime objects.

- `arraySize`: number

```ts
funcs.datetime({ arraySize: 3 });
```

## year

Generates years in YYYY.

- `arraySize`: number

```ts
funcs.year({ arraySize: 3 });
```

## json

Generates JSON with fixed structure (randomly picked).

```ts
funcs.json({ arraySize: 3 });
```

## interval

Generates time intervals.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.interval({ isUnique: true, arraySize: 3 });
```

## string

Generates random strings.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.string({ isUnique: false, arraySize: 3 });
```

## uuid

Generates v4 UUIDs.

- `arraySize`: number

```ts
funcs.uuid({ arraySize: 3 });
```

## firstName

Generates first names.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.firstName({ isUnique: true, arraySize: 3 });
```

## lastName

Generates last names.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.lastName({ isUnique: false, arraySize: 3 });
```

## fullName

Generates full names.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.fullName({ isUnique: true, arraySize: 3 });
```

## email

Generates unique emails.

- `arraySize`: number

```ts
funcs.email({ arraySize: 3 });
```

## phoneNumber

Generates phone numbers.

- `template`: string
- `prefixes`: string[]
- `generatedDigitsNumbers`: number | number[]
- `arraySize`: number

```ts
funcs.phoneNumber({ template: "+(380) ###-####", arraySize: 3 });
```

## country

Generates country names.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.country({ isUnique: false, arraySize: 3 });
```

## city

Generates city names.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.city({ isUnique: false, arraySize: 3 });
```

## streetAddress

Generates addresses.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.streetAddress({ isUnique: false, arraySize: 3 });
```

## jobTitle

Generates job titles.

- `arraySize`: number

```ts
funcs.jobTitle({ arraySize: 3 });
```

## postcode

Generates postal codes.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.postcode({ isUnique: true, arraySize: 3 });
```

## state

Generates US states.

- `arraySize`: number

```ts
funcs.state({ arraySize: 3 });
```

## companyName

Generates company names.

- `isUnique`: boolean
- `arraySize`: number

```ts
funcs.companyName({ isUnique: true, arraySize: 3 });
```

## loremIpsum

Generates lorem ipsum sentences.

- `sentencesCount`: number (default 1)
- `arraySize`: number

```ts
funcs.loremIpsum({ sentencesCount: 2, arraySize: 3 });
```

## point

Generates 2D points.

- `isUnique`: boolean
- `maxXValue`: number
- `minXValue`: number
- `maxYValue`: number
- `minYValue`: number
- `arraySize`: number

```ts
funcs.point({
  isUnique: true,
  minXValue: -5,
  maxXValue: 20,
  minYValue: 0,
  maxYValue: 30,
  arraySize: 3,
});
```

## line

Generates 2D lines (a*x + b*y + c = 0).

- `isUnique`: boolean
- `maxAValue`: number
- `minAValue`: number
- `maxBValue`: number
- `minBValue`: number
- `maxCValue`: number
- `minCValue`: number
- `arraySize`: number

```ts
funcs.line({
  isUnique: true,
  minAValue: -5,
  maxAValue: 20,
  minBValue: 0,
  maxBValue: 30,
  minCValue: 0,
  maxCValue: 10,
  arraySize: 3,
});
```

## bitString

Generates bit strings.

- `isUnique`: boolean
- `dimensions`: number
- `arraySize`: number

```ts
funcs.bitString({ dimensions: 12, isUnique: true, arraySize: 3 });
```

## inet

Generates IP addresses.

- `isUnique`: boolean
- `arraySize`: number
- `ipAddress`: 'ipv4' | 'ipv6' (default 'ipv4')
- `includeCidr`: boolean (default true)

```ts
funcs.inet({
  isUnique: true,
  arraySize: 3,
  ipAddress: "ipv4",
  includeCidr: true,
});
```

## geometry

Generates geometry points.

- `isUnique`: boolean
- `arraySize`: number
- `type`: 'point'
- `srid`: 4326 | 3857 (default 4326)
- `decimalPlaces`: 1-7 (default 6)

Warnings: arraySize >1 not supported; SRID !=0 not supported.

```ts
funcs.geometry({
  isUnique: true,
  arraySize: 1,
  type: "point",
  srid: 4326,
  decimalPlaces: 5,
});
```

## vector

Generates vectors.

- `isUnique`: boolean
- `arraySize`: number
- `decimalPlaces`: number (default 2)
- `dimensions`: number
- `minValue`: number (default -1000)
- `maxValue`: number (default 1000)

```ts
funcs.vector({
  isUnique: true,
  arraySize: 3,
  decimalPlaces: 5,
  dimensions: 12,
  minValue: -100,
  maxValue: 100,
});
```
