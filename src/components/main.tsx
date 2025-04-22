import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

import FeatureArea from './feature-area';
import Header from './header';
interface MainPageProp {
  conversationId?: string;
}

export default async function Main({conversationId}:MainPageProp) {
  return (
    <SidebarProvider >
      <AppSidebar />
      <SidebarInset>
        <Header />
        <FeatureArea conversationId={conversationId}/>
      </SidebarInset>
    </SidebarProvider>
  );
}
