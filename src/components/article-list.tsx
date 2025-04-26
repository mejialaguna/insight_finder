import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDistanceToNow } from '@/lib/utils';

import type { Article } from '@/interfaces';

interface ArticleListProps {
  articles: Article[];
}

export function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <p className="text-muted-foreground">
          No articles found. Try a different search query.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {articles.map((article, idx) => (
        <Card key={`${article?.isoDate}-${idx}`} className="border bg-card text-card-foreground gap-2">
          <CardHeader className="">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{article?.title}</CardTitle>
              <Badge variant="outline">{article?.articleType}</Badge>
            </div>
            <CardDescription className="text-xs">
              {formatDistanceToNow(new Date(article?.pubDate || ''))}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm">{article?.content}</p>
          </CardContent>
          <CardFooter className="pt-0 text-blue-500 font-semibold">
            <Link
              href={article?.link || ''}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center hover:underline"
            >
              Read full article <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
