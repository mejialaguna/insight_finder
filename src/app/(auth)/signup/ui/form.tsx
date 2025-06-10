'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeClosed } from 'lucide-react';
import { useCallback, useMemo, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';

import { signUpUser } from '@/actions/user/signUp';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpSchema, type TAuthSignUp } from '@/lib/content-types';

export default function Form() {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [isConfirmPasswordVisible, setConfirmIsPasswordVisible] =
    useState<boolean>(false);
  const Icon = useMemo(
    () => ({
      password: isPasswordVisible ? Eye : EyeClosed,
      confirmPassword: isConfirmPasswordVisible ? Eye : EyeClosed,
    }),
    [isPasswordVisible, isConfirmPasswordVisible]
  );
  const {
    register,
    trigger,
    getValues,
    clearErrors,
    formState: { errors },
  } = useForm<TAuthSignUp>({
    // ** this resolver is handling the validation of the form using zod, and no longer need to add the validation in the input components e.g. {...register('imageUrl', {required: true})} now we only need to add {...register('imageUrl')}

    resolver: zodResolver(signUpSchema),
  });

  const handleAction = useCallback(async () => {
    const result = await trigger();
    if (!result) return;

    const { email, name, password, confirmPassword }: TAuthSignUp = getValues();
    try {
      const response = await signUpUser({
        name,
        email,
        password,
        confirmPassword,
      });

      if (!response?.ok) {
        setErrorMessage(response?.message || 'Signup failed');
        return;
      }

      // Redirect to home after successful signup and sign in
      window.location.replace('/');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrorMessage('Error during signup. Please try again later.');
    }
  }, [getValues, trigger]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, dispatch] = useActionState(handleAction, undefined);

  return (
    <form action={dispatch}>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Name</Label>
          <Input
            id='name'
            placeholder='John Doe'
            {...register('name', {
              onChange: () => {
                clearErrors('name');
                setErrorMessage('');
              },
            })}
          />
          {errors.name && (
            <p className='text-red-500 text-xs'>{errors.name.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='m@example.com'
            {...register('email', {
              onChange: () => {
                clearErrors('email');
                setErrorMessage('');
              },
            })}
          />
          {errors.email && (
            <p className='text-red-500 text-xs'>{errors.email.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <div className='flex relative'>
            <Icon.password
              className='absolute right-5 top-2 cursor-pointer h-5'
              onClick={() => setIsPasswordVisible((prev) => !prev)}
            />
            <Input
              id='password'
              type={isPasswordVisible ? 'text' : 'password'}
              {...register('password', {
                onChange: () => {
                  clearErrors('password');
                  setErrorMessage('');
                },
              })}
            />
          </div>
          {errors.password && (
            <p className='text-red-500 text-xs'>{errors.password.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <div className='flex relative'>
            <Icon.confirmPassword
              className='absolute right-5 top-2 cursor-pointer h-5'
              onClick={() => setConfirmIsPasswordVisible((prev) => !prev)}
            />
            <Input
              id='confirmPassword'
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              {...register('confirmPassword', {
                onChange: () => {
                  clearErrors('confirmPassword');
                  setErrorMessage('');
                },
              })}
            />
          </div>
          {errors.confirmPassword && (
            <p className='text-red-500 text-xs'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        {errorMessage && (
          <div>
          <small className='text-red-600'>{errorMessage}</small>
          </div>
        )}
        <SignUpButton />
      </CardContent>
    </form>
  );
}

const SignUpButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      variant={'secondary'}
      className='text-sm text-white font-extrabold hover:text-stone-100
        w-full bg-gradient-to-br from-orange-200 to-orange-500 hover:scale-105 transition-all flex justify-self-center'
      disabled={pending}
    >
      Sign up
    </Button>
  );
};
