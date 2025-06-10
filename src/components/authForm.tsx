import React from 'react';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import AuthNavigation from './authNavigation';

interface AuthFormProps {
  children: React.ReactNode;
  path: string;
}

export const AuthForm = ({ children, path }: AuthFormProps) => {

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Welcome to InsightFinder
          </CardTitle>
          <CardDescription className='text-center'>
            {path !== 'login'
              ? 'Sign in to your account'
              : 'Create an account to get started'}
          </CardDescription>
        </CardHeader>
        {children}
        <CardFooter className='flex flex-col space-y-4'>
          <AuthNavigation
            pathName={`/${path}`}
            label={`${path === 'login' ? 'Already have an account? Sign in' : 'Need an account? Sign up'} `}
          />
        </CardFooter>
      </Card>
    </div>
  );
};
