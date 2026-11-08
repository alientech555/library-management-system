# Library Management System

A NestJS + PostgreSQL + Prisma API for managing a library catalog of books, genres, users, and reviews.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS (opinionated modules / controllers / services)
- **ORM:** Prisma (typed client generated from `schema.prisma`)
- **Database:** Hosted PostgreSQL (Neon / Supabase)

## Schema Decisions

### Why `Book` references `Genre` via a foreign key instead of embedding it

In a document database (e.g. MongoDB), it is tempting to store a book like this:

```json
{
  "title": "Dune",
  "genre": { "name": "Science Fiction", "description": "..." }
}
```

We deliberately chose **not** to embed the genre inside each book. Instead, `Book` holds a `genreId` foreign key that points to a standalone `Genre` row. The reasons:

1. **Single source of truth.** A genre's name and description live in exactly one row. If we rename "Science Fiction" → "Sci-Fi", one `UPDATE` propagates to every book — no risky bulk rewrites across embedded copies.
2. **No duplication, no drift.** Embedding would duplicate the genre payload on every book row. Over time those copies drift (typos, stale data). A foreign key makes drift structurally impossible.
3. **Efficient querying and indexing.** `WHERE genreId = 2` is a single indexed lookup. With embedding, filtering by genre requires scanning every document's nested object — slower and harder to index.
4. **Referential integrity.** PostgreSQL enforces that every `genreId` points to a real genre. You cannot accidentally create a book with a misspelled or deleted genre. Embedding offers no such guarantee.
5. **Bidirectional navigation.** Prisma's `@relation` gives us `book.genre` *and* `genre.books` for free — both directions are first-class. Embedding makes the reverse direction (all books in a genre) expensive.
6. **Normalization.** This is classic 3NF: non-key attributes (genre name, description) depend on the genre key, not on the book key.

In short: embedding optimizes for *read-one-book-fast*; a foreign key optimizes for *correctness, maintainability, and query flexibility* — which is what a catalog system needs.

### Prisma vs. a document database — what felt different

Coming from MongoDB/Mongoose, the biggest mental shift was that **the schema is no longer a suggestion — it is the contract**. In a document DB you can add a field to one document and leave the others untouched; in Prisma, the moment you add a field to `schema.prisma` and run `prisma migrate dev`, every row in the real Postgres table gains that column, and the generated TypeScript client immediately reflects it. There is no "maybe this field exists at runtime" — either the type says it's there, or it isn't. This eliminates an entire class of `undefined` bugs, but it also means you have to think about your data shape *up front* rather than letting it evolve organically per document.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your hosted Postgres URL
cp api/.env.example api/.env

# 3. Run migrations (creates tables + regenerates Prisma client)
npx prisma migrate dev --name init

# 4. Seed the database (4+ genres, 15+ books, users, reviews)
npx prisma db seed

# 5. Start the dev server
npm run start:dev
```

## Stretch Goals Completed

- ✅ `Review` model added with `bookId`, `userId`, `rating`, `comment`
- ✅ Unique constraint `@@unique([bookId, userId])` enforces one review per user per book
- ✅ Seed script populates reviews alongside books and users