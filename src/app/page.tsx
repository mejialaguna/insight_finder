import Main from '@/components/main';

interface HomePageProp {
  searchParams: {
    conversationId?: string;
  };
}

export default async function Home({searchParams}:HomePageProp) {
  const { conversationId } = await searchParams;
  return (
    <Main conversationId={conversationId} />
  );
}
