import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// -----------------------------------------------------------------------------
// Seed data
// -----------------------------------------------------------------------------

const genres = [
  { name: 'Science Fiction', description: 'Speculative futures, space, and technology.' },
  { name: 'Mystery', description: 'Whodunits, thrillers, and detective fiction.' },
  { name: 'History', description: 'Narratives and analyses of the human past.' },
  { name: 'Fantasy', description: 'Magic, myth, and imagined worlds.' },
  { name: 'Biography', description: 'True stories of remarkable lives.' },
];

const books = [
  // Science Fiction
  { title: 'Dune', author: 'Frank Herbert', isbn: '978-0441172719', publishedYear: 1965, pageCount: 688, genre: 'Science Fiction' },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '978-0441569595', publishedYear: 1984, pageCount: 271, genre: 'Science Fiction' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '978-0441478125', publishedYear: 1969, pageCount: 304, genre: 'Science Fiction' },
  { title: 'Foundation', author: 'Isaac Asimov', isbn: '978-0553293357', publishedYear: 1951, pageCount: 244, genre: 'Science Fiction' },

  // Mystery
  { title: 'The Big Sleep', author: 'Raymond Chandler', isbn: '978-0394758282', publishedYear: 1939, pageCount: 256, genre: 'Mystery' },
  { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '978-0307588371', publishedYear: 2012, pageCount: 432, genre: 'Mystery' },
  { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', isbn: '978-0307454546', publishedYear: 2005, pageCount: 672, genre: 'Mystery' },

  // History
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0062316097', publishedYear: 2011, pageCount: 464, genre: 'History' },
  { title: 'The Silk Roads', author: 'Peter Frankopan', isbn: '978-1101946329', publishedYear: 2015, pageCount: 636, genre: 'History' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '978-0393354324', publishedYear: 1997, pageCount: 528, genre: 'History' },

  // Fantasy
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '978-0756404741', publishedYear: 2007, pageCount: 662, genre: 'Fantasy' },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '978-0547722023', publishedYear: 1968, pageCount: 183, genre: 'Fantasy' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0547928227', publishedYear: 1937, pageCount: 300, genre: 'Fantasy' },

  // Biography
  { title: 'Steve Jobs', author: 'Walter Isaacson', isbn: '978-1451648539', publishedYear: 2011, pageCount: 656, genre: 'Biography' },
  { title: 'Becoming', author: 'Michelle Obama', isbn: '978-1524763138', publishedYear: 2018, pageCount: 448, genre: 'Biography' },
  { title: 'Long Walk to Freedom', author: 'Nelson Mandela', isbn: '978-0316547383', publishedYear: 1994, pageCount: 528, genre: 'Biography' },
];

const reviews = [
  { bookTitle: 'Dune', userEmail: 'ada@library.io', rating: 5, comment: 'A masterwork of world-building.' },
  { bookTitle: 'Gone Girl', userEmail: 'lin@library.io', rating: 4, comment: 'Gripping and unpredictable.' },
  { bookTitle: 'Sapiens', userEmail: 'grace@library.io', rating: 5, comment: 'Changed how I see human history.' },
  { bookTitle: 'The Hobbit', userEmail: 'ada@library.io', rating: 5, comment: 'Timeless and charming.' },
  { bookTitle: 'Steve Jobs', userEmail: 'lin@library.io', rating: 4, comment: 'Candid and deeply human.' },
];

const users = [
  { email: 'ada@library.io', name: 'Ada Lovelace', role: Role.LIBRARIAN },
  { email: 'lin@library.io', name: 'Linus Torvalds', role: Role.PATRON },
  { email: 'grace@library.io', name: 'Grace Hopper', role: Role.PATRON },
];

// -----------------------------------------------------------------------------
// Seed runner
// -----------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed genres — use upsert so the script is idempotent.
  for (const g of genres) {
    await prisma.genre.upsert({
      where: { name: g.name },
      update: { description: g.description },
      create: g,
    });
  }
  console.log(`   ✅ Seeded ${genres.length} genres`);

  // 2. Seed users.
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: u,
    });
  }
  console.log(`   ✅ Seeded ${users.length} users`);

  // 3. Seed books — look up each genre by name to obtain its id.
  for (const b of books) {
    const genre = await prisma.genre.findUniqueOrThrow({
      where: { name: b.genre },
    });

    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {
        title: b.title,
        author: b.author,
        publishedYear: b.publishedYear,
        pageCount: b.pageCount,
        genreId: genre.id,
      },
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        publishedYear: b.publishedYear,
        pageCount: b.pageCount,
        genre: { connect: { id: genre.id } },
      },
    });
  }
  console.log(`   ✅ Seeded ${books.length} books`);

  // 4. Seed reviews (stretch).
  for (const r of reviews) {
    const book = await prisma.book.findUniqueOrThrow({ where: { isbn: books.find(b => b.title === r.bookTitle)!.isbn } });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: r.userEmail } });

    await prisma.review.upsert({
      where: {
        bookId_userId: { bookId: book.id, userId: user.id },
      },
      update: { rating: r.rating, comment: r.comment },
      create: {
        rating: r.rating,
        comment: r.comment,
        book: { connect: { id: book.id } },
        user: { connect: { id: user.id } },
      },
    });
  }
  console.log(`   ✅ Seeded ${reviews.length} reviews`);

  console.log('🎉 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });