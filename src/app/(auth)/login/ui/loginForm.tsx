import React from 'react';

import { AuthForm } from '@/components/authForm';

import Form from './form';

export const LoginForm = () => {
  return (
    <AuthForm path='signup'>
      <Form />
    </AuthForm>
  );
};
