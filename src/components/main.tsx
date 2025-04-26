export const revalidate = 1209600; // 2 weeks in seconds

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import getFeed from '@/lib/server-utils';

import FeatureArea from './feature-area';
import Header from './header';
interface MainPageProp {
  conversationId?: string;
}

export default async function Main({ conversationId }: MainPageProp) {
  const { ok, articles } = await getFeed();

  if (!ok) {
    return <div>Error fetching feed</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar conversationId={conversationId} />
      <SidebarInset>
        <Header />
        <FeatureArea conversationId={conversationId} articles={articles} />
      </SidebarInset>
    </SidebarProvider>
  );
}
