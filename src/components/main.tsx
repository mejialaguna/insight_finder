import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import FeatureArea from './feature-area';
import Header from './header';
interface MainPageProp {
  conversationId?: string;
}

const articles = [
  {
    id: '3f29b9e2-8c44-4df8-86e4-9f9724d4d9f1',
    title: 'The Future of AI: Opportunities and Challenges',
    articleType: 'Technology',
    link: '/articles/future-of-ai',
    description:
      'Exploring how artificial intelligence is shaping the future across industries.',
    publishDate: '2025-04-20',
  },
  {
    id: '17c39a8e-27b3-4b62-bdc7-48b83f27f4f8',
    title: '10 Best Places to Travel in 2025',
    articleType: 'Travel',
    link: '/articles/best-travel-2025',
    description:
      'A curated list of must-visit destinations for your next adventure.',
    publishDate: '2025-04-19',
  },
  {
    id: '74b839f2-29b7-46a5-b57b-499d6ac83ef9',
    title: 'How to Build a Healthy Morning Routine',
    articleType: 'Lifestyle',
    link: '/articles/morning-routine-guide',
    description: 'Practical tips for starting your day with energy and focus.',
    publishDate: '2025-04-18',
  },
  {
    id: 'ac81d83b-2c6e-4d9b-b7e5-6eb2abf9e51e',
    title: 'The Rise of Electric Vehicles: What You Need to Know',
    articleType: 'Automotive',
    link: '/articles/electric-vehicles-guide',
    description:
      'Understanding the EV revolution and what it means for consumers.',
    publishDate: '2025-04-17',
  },
  {
    id: 'd5ea7268-59f2-4c80-8fd6-291b091d17c3',
    title: 'Mastering Remote Work: Tools and Strategies',
    articleType: 'Career',
    link: '/articles/remote-work-strategies',
    description:
      'Best practices for staying productive and connected while working remotely.',
    publishDate: '2025-04-16',
  },
  {
    id: '62c7b4b4-59b0-4d38-bf30-b80af5269cf6',
    title: 'Top 5 Programming Languages to Learn in 2025',
    articleType: 'Education',
    link: '/articles/top-programming-languages',
    description:
      'Stay ahead in tech by mastering these in-demand programming languages.',
    publishDate: '2025-04-15',
  },
  {
    id: 'b5a0a789-1736-4647-b249-628d65a8cb62',
    title: "Beginner's Guide to Investing in Stocks",
    articleType: 'Finance',
    link: '/articles/stock-investing-guide',
    description:
      'Learn the basics of stock investing and how to get started safely.',
    publishDate: '2025-04-14',
  },
  {
    id: 'efc39377-7b09-4b7e-961c-0dbbd53d1dbe',
    title: 'The Art of Mindfulness: How to Be Present Every Day',
    articleType: 'Health',
    link: '/articles/mindfulness-everyday',
    description:
      'Simple techniques to reduce stress and improve mental clarity.',
    publishDate: '2025-04-13',
  },
  {
    id: 'a2f429d5-c6b7-4769-b10f-b29a92e7c9fa',
    title: 'Home Decor Trends You’ll Love This Year',
    articleType: 'Home',
    link: '/articles/home-decor-trends-2025',
    description: 'Stylish and modern ideas to refresh your living space.',
    publishDate: '2025-04-12',
  },
  {
    id: '3e4b2f89-24e5-4d29-8fd4-1c8eaa839ce5',
    title: 'The Evolution of Online Education',
    articleType: 'Education',
    link: '/articles/online-education-evolution',
    description: 'How virtual learning is transforming education worldwide.',
    publishDate: '2025-04-11',
  },
];

export default async function Main({ conversationId }: MainPageProp) {
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
