/* eslint-disable @typescript-eslint/no-explicit-any */
import Main from '@/components/main';

interface PageProps {
  params?: any;
  searchParams?: any;
}

export default function Home(props: PageProps) {
  // Extract searchParams which might be a Promise or direct object
  const searchParams = props.searchParams || {};
  
  const conversationId =
    typeof searchParams.conversationId === 'string'
      ? searchParams.conversationId
      : undefined;

  return <Main conversationId={conversationId} />;
}
