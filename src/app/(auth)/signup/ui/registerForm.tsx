import React from 'react';

import { AuthForm } from '@/components/authForm';

import Form from './form';



export const RegisterForm = () => {
  return (
    <AuthForm path='login'>
      <Form />
    </AuthForm>
  );
};
