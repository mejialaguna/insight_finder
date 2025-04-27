/* eslint-disable no-console */
import { title } from 'process';
import prisma from '../lib/prisma';
import getFeed, { batchGenerateEmbeddings } from '../lib/server-utils';
import { validateAndDeduplicateArticles } from '../lib/utils';

async function main() {
  await prisma.article.deleteMany({});
  console.log('🧹 Old articles cleared.');

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

  await prisma.article.createMany({
    data: articlesWithEmbeddings,
  });

  console.log('✅ Articles seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
