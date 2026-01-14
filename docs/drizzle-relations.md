# Drizzle Relations Fundamentals

## Normalization

Normalization organizes data to reduce redundancy and improve integrity.

### 1NF (First Normal Form)

Each column holds a single, indivisible value. No repeating groups.

**Example**:

```sql
-- Normalized to 1NF
CREATE TABLE Customers_1NF (
    customer_id INT PRIMARY KEY,
    name VARCHAR(255),
    street_address VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    zip_code VARCHAR(10)
);
```

### 2NF (Second Normal Form)

For tables with composite primary keys, all non-key attributes must be fully dependent on the entire key.

**Example**:

```sql
CREATE TABLE Products (
    product_id VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(100),
    product_price DECIMAL(10, 2)
);

CREATE TABLE OrderItems_2NF (
    order_id INT,
    product_id VARCHAR(10),
    quantity INT,
    order_date DATE,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
```

### 3NF (Third Normal Form)

Remove transitive dependencies; non-key attributes should not depend on other non-key attributes.

**Example**:

```sql
CREATE TABLE zip_codes (
    zip_code VARCHAR(10) PRIMARY KEY,
    city VARCHAR(100),
    state VARCHAR(50)
);

CREATE TABLE suppliers (
    supplier_id VARCHAR(10) PRIMARY KEY,
    supplier_name VARCHAR(255),
    zip_code VARCHAR(10),
    FOREIGN KEY (zip_code) REFERENCES zip_codes(zip_code)
);
```

## Database Relationships

### One-to-One

Each record in table A relates to at most one in table B, and vice versa.

### One-to-Many

One record in table A relates to many in table B; each in B relates to one in A.

### Many-to-Many

Records in both tables can relate to many in the other. Requires a junction table.

**Example**:

```sql
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE courses (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    credits INT
);

CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    course_id INT,
    enrollment_date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE KEY (student_id, course_id)
);
```

## Why Foreign Keys?

Foreign keys enforce relationships, maintain referential integrity, and prevent orphaned records.

## Why NOT Foreign Keys?

Avoid in high-write environments for performance, distributed systems due to complexity, or legacy integrations.

## Polymorphic Relations

Allow a single relationship to point to different entity types.

**Example**:

```sql
-- Comments table
CREATE TABLE Comments (
    comment_id INT PRIMARY KEY,
    commentable_type VARCHAR(255), -- e.g., 'articles', 'products'
    commentable_id INT,
    user_id INT,
    comment_text TEXT
);
```

Source: https://orm.drizzle.team/docs/relations-v1-v2
