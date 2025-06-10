'use server';

/* eslint-disable no-console */
import bcrypt from 'bcryptjs';

import prisma from '../lib/prisma';
// eslint-disable-next-line import/order
import getFeed, {
  batchGenerateEmbeddings,
  isValidEmbedding,
} from '../helpers/seed-helper';
import { validateAndDeduplicateArticles } from '../lib/utils';

async function main() {
  await prisma.article.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('🧹 Old articles cleared.');

  const hashedPassword = await bcrypt.hash('@2ZfzjN6!Lmr45', 10);

  const user = await prisma.user.create({
    data: {
      name: 'mejia laguna',
      email: 'mejialaguna@yahoo.com',
      password: hashedPassword,
    },
  });
  console.log(`✅ User created: ${user.name}`);

  const { ok, articles, message } = await getFeed();
  if (!ok) {
    console.error('❌ Error fetching articles:', message);
    return;
  }
  // Convert pubDate strings to Date objects before validation
  const articlesWithDates =
    articles?.map((article) => ({
      title: article.title,
      link: article.link,
      pubDate: article.pubDate ? new Date(article.pubDate) : new Date(),
      content: article.content,
      articleType: article.articleType,
    })) ?? [];

  const validUniqueArticles = validateAndDeduplicateArticles(articlesWithDates);

  if (validUniqueArticles.length === 0) {
    console.error('⚠️ No valid articles found to insert.');
    return;
  }

  // 1. Prepare title and content
  const articleInputs = validUniqueArticles.map((article) => ({
    title: article.title,
    content: article.content,
  }));

  // 2. Batch embed
  const embeddings = await batchGenerateEmbeddings(articleInputs);

  // 3. Attach embeddings
  const articlesWithEmbeddings = validUniqueArticles.map((article, idx) => ({
    ...article,
    embedding: embeddings[idx],
  }));

    // Validate embeddings
    const safeArticlesToInsert = articlesWithEmbeddings.filter((article, idx) => {
      if (!isValidEmbedding(article.embedding)) {
        console.warn(`⚠️ Invalid embedding for article [${article.title}] at index ${idx}. Skipping.`);
        return false;
      }
      return true;
    });
  
    if (safeArticlesToInsert.length === 0) {
      console.error('❌ No valid articles to insert after embedding validation.');
      return;
    }

  await prisma.article.createMany({
    data: articlesWithEmbeddings,
  });

  console.log(`✅ Seeded ${safeArticlesToInsert.length} articles successfully.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
