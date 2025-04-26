/* eslint-disable @typescript-eslint/no-explicit-any */
import Main from '@/components/main';

interface PageProps {
  params?: any;
  searchParams?: any;
}

export default async function Home(props: PageProps) {
  // Extract searchParams which might be a Promise or direct object
  // In Next.js 15.3, searchParams needs to be awaited before accessing its properties
  const awaitedSearchParams = await (props.searchParams || {});

  // Now access the properties from the awaited object
  const conversationId = typeof awaitedSearchParams.conversationId === 'string' 
    ? awaitedSearchParams.conversationId 
    : undefined;

  return <Main conversationId={conversationId} />;
}
