import { z } from 'zod';

import type OpenAI from 'openai';

/* eslint-disable max-len */
export type ContentType =
  | 'blog-post'
  | 'product-description'
  | 'social-media'
  | 'ad-copy';

export type ContentTone =
  | 'formal'
  | 'casual'
  | 'funny'
  | 'persuasive'
  | 'informative';

export type InputLabelType = 'topic' | 'tone' | 'model' | 'keywords';

const passwordSchemaObject = z
  .string()
  .min(1, 'Required')
  .min(6, 'Password must be at least 6 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

export const authSchema = z.object({
  email: z.string().min(1, 'Required').email('Invalid Email').max(100),
  password: z
    .string()
    .min(1, 'Required')
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});

export const signUpSchema = z
  .object({
    name: z.string().min(3, 'Required').max(100),
    email: z.string().min(1, 'Required').email('Invalid Email').max(100),
    password: z
      .string()
      .min(1, 'Required')
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const securitySchema = z
  .object({
    email: z.string().min(1, 'Required').email('Invalid Email').max(100),
    password: passwordSchemaObject,
    newPassword: passwordSchemaObject,
    confirmPassword: passwordSchemaObject,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((data) => data.password !== data.newPassword, {
    path: ['newPassword'],
    message: 'Passwords should be different than the previous one.',
  });

export type TAuthSignIn = z.infer<typeof authSchema>;
export type TAuthSignUp = z.infer<typeof signUpSchema>;
export type TAuthSecurity = z.infer<typeof securitySchema>;

export interface ContentTypeConfig {
  id: ContentType;
  name: string;
  description: string;
  icon: string;
  promptTemplate: string;
  defaultTone: ContentTone;
  maxLength: number;
}

export type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4';
export interface GenerateContentProps {
  contentType: ContentType;
  topic: string;
  tone: ContentTone;
  keywords?: string[];
  client: OpenAI;
}

export interface GeneratedContentData
  extends Omit<GenerateContentProps, 'client'> {
  userId: string;
  generatedContent: string;
  model: OpenAIModel;
}

export interface TabDataType
  extends Omit<GenerateContentProps, 'client' | 'contentType'> {
  model: OpenAIModel | '';
  generatedContent: string;
  error: string;
}

export interface ResponseStatus {
  ok: boolean;
  message?: string;
}

export interface UserStats {
  id: string;
  updatedAt: Date;
  userId: string;
  totalWords: number;
  totalContents: number;
  blogPostCount: number;
  productDescriptionCount: number;
  socialMediaCount: number;
  adCopyCount: number;
}

export interface UserStatsResponse extends ResponseStatus {
  userStats: UserStats | Record<string, never>;
}

export interface UserGeneratedContent {
  id: string;
  userId: string;
  contentType: string;
  topic: string;
  tone: string;
  keywords?: string[];
  generatedContent: string;
  createdAt: Date;
}

export interface UserGeneratedContentById extends ResponseStatus {
  content: {
    id: string;
    userId: string;
    contentType: string;
    topic: string;
    tone: string;
    keywords?: string[];
    generatedContent: string;
    createdAt: Date;
    model: OpenAIModel;
  } | null;
}

export interface UserGeneratedContentResponse extends ResponseStatus {
  userContent: UserGeneratedContent[];
  contentCount?: number;
  totalPages?: number;
}

export interface UserStatsAndContentResponse extends ResponseStatus {
  userStats: UserStats | Record<string, never>;
  userContent: UserGeneratedContent[];
}

export const contentTypes: Record<ContentType, ContentTypeConfig> = {
  'blog-post': {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Create engaging blog posts on any topic',
    icon: 'FileText',
    promptTemplate:
      'Write a blog post about {topic}. The tone should be {tone}. Include a compelling headline, introduction, several key points with subheadings, and a conclusion.',
    defaultTone: 'informative',
    maxLength: 2000,
  },
  'product-description': {
    id: 'product-description',
    name: 'Product Description',
    description: 'Generate compelling product descriptions',
    icon: 'ShoppingBag',
    promptTemplate:
      'Write a product description for {topic}. The tone should be {tone}. Highlight the key features, benefits, and unique selling points.',
    defaultTone: 'persuasive',
    maxLength: 500,
  },
  'social-media': {
    id: 'social-media',
    name: 'Social Media Caption',
    description: 'Craft attention-grabbing social media posts',
    icon: 'MessageSquare',
    promptTemplate:
      'Write a social media caption about {topic}. The tone should be {tone}. Make it engaging and include relevant hashtags.',
    defaultTone: 'casual',
    maxLength: 280,
  },
  'ad-copy': {
    id: 'ad-copy',
    name: 'Ad Copy',
    description: 'Write persuasive ad copy that drives conversions',
    icon: 'BarChart',
    promptTemplate:
      'Write ad copy for {topic}. The tone should be {tone}. Focus on benefits, include a clear call to action, and keep it concise.',
    defaultTone: 'persuasive',
    maxLength: 150,
  },
};

export const contentTones: Record<
  ContentTone,
  { name: string; description: string }
> = {
  formal: {
    name: 'Formal',
    description: 'Professional and business-like',
  },
  casual: {
    name: 'Casual',
    description: 'Relaxed and conversational',
  },
  funny: {
    name: 'Funny',
    description: 'Humorous and entertaining',
  },
  persuasive: {
    name: 'Persuasive',
    description: 'Convincing and compelling',
  },
  informative: {
    name: 'Informative',
    description: 'Educational and factual',
  },
};
