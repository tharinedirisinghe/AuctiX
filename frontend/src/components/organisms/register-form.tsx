import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AxiosInstance } from 'axios';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Octagon, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/hooks';
import { IJwtData } from '@/types/IJwtData';
import { AlertBox } from './AlertBox';
import {
  IValidationError,
  ValidateErrorElement,
} from '../atoms/validityIndicator';
import UserValidityIndicator from '../molecules/UserValidityIndicator';
import { IRegisterUser, registerUser } from '@/services/authService';
import AxiosRequest from '@/services/axiosInspector';

export function TabsDemo({
  onTabChange,
}: {
  onTabChange: (value: string) => void;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [repeatPassword, setRepeatPassword] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [AlertIcon, setAlertIcon] = useState<React.ReactNode>(null);
  const [msg, setMsg] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [validationErrors, setValidationErrors] = useState<IValidationError[]>(
    [],
  );
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isLoginSuccessRef = useRef(isLoginSuccess);

  useEffect(() => {
    validations();
  }, [email, password, repeatPassword, firstName, lastName, username]);

  useEffect(() => {
    isLoginSuccessRef.current = isLoginSuccess;
  }, [isLoginSuccess]);

  const handleInputType = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.id === 'password') {
      setPassword(e.target.value);
    } else if (e.target.id === 'email') {
      setEmail(e.target.value);
    } else if (e.target.id === 'repeat_password') {
      setRepeatPassword(e.target.value);
    } else if (e.target.id === 'fname') {
      setFirstName(e.target.value);
    } else if (e.target.id === 'lname') {
      setLastName(e.target.value);
    } else if (e.target.id === 'username') {
      setUsername(e.target.value);
    } else {
      console.warn('Input type not handled', e.target.id);
    }
  };

  const validations = (isRegBtnClicked = false) => {
    let isValid = true;
    let errorList: IValidationError[] = [];
    if (isRegBtnClicked) {
      if (!username) {
        isValid = false;
        errorList.push({
          fieldId: 'username',
          msg: 'Username is required',
        });
      }

      if (!email) {
        isValid = false;
        errorList.push({
          fieldId: 'email',
          msg: 'Email is required',
        });
      }

      if (!password) {
        isValid = false;
        errorList.push({
          fieldId: 'password',
          msg: 'Password is required',
        });
      }

      if (!repeatPassword) {
        isValid = false;
        errorList.push({
          fieldId: 'repeat-password',
          msg: 'Repeat password is required',
        });
      }

      if (!firstName) {
        isValid = false;
        errorList.push({
          fieldId: 'fname',
          msg: 'First name is required',
        });
      }

      if (!lastName) {
        isValid = false;
        errorList.push({
          fieldId: 'lname',
          msg: 'Last name is required',
        });
      }
    }

    if (username && username.length < 3) {
      errorList.push({
        fieldId: 'username',
        msg: 'Username must be at least 3 characters',
      });
      isValid = false;
    }

    if (repeatPassword && password !== repeatPassword) {
      errorList.push({
        fieldId: 'repeat-password',
        msg: 'Passwords do not match',
      });
      isValid = false;
    }

    if (email && email.length < 3) {
      errorList.push({
        fieldId: 'email',
        msg: 'Email must be at least 3 characters',
      });
      isValid = false;
    }

    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) === false) {
      errorList.push({
        fieldId: 'email',
        msg: 'Email is not valid',
      });
      isValid = false;
    }

    if (firstName && firstName.length < 3) {
      errorList.push({
        fieldId: 'fname',
        msg: 'First name must be at least 3 characters',
      });
      isValid = false;
    }

    if (lastName && lastName.length < 3) {
      errorList.push({
        fieldId: 'lname',
        msg: 'Last name must be at least 3 characters',
      });
      isValid = false;
    }

    if (password && password.length < 6) {
      errorList.push({
        fieldId: 'password',
        msg: 'Password must be at least 6 characters',
      });
      isValid = false;
    }

    // Update validation errors with the complete list
    setValidationErrors(errorList);

    return isValid;
  };

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;
  const handleRegister = (userType: string) => {
    console.log('Registering', userType);
    if (validations(true)) {
      setIsLoading(true);

      const registerData: IRegisterUser = {
        email: email as string,
        password: password as string,
        username: username as string,
        firstName: firstName as string,
        lastName: lastName as string,
        role: userType as 'SELLER' | 'BIDDER',
      };
      registerUser(registerData, axiosInstance, dispatch)
        .then((response: IJwtData) => {
          console.log('Registered', response);
          setIsLoginSuccess(true);
          showSuccessAlert('Account created successfully');
        })
        .catch((error: any) => {
          console.error('Error registering', error);
          setIsLoginSuccess(false);
          showErrorAlert(error.response.data.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      showErrorAlert(
        'Validation failed: Please resolve the error messages in the form',
      );
    }
  };

  const ErrorIcon = <Octagon className="w-6 h-6 text-red-500" />;
  const SuccessIcon = <Scale className="w-6 h-6 text-green-500" />;

  const showErrorAlert = (msg: string) => {
    setAlertTitle('Error');
    setAlertIcon(ErrorIcon);
    setMsg(msg);
    setAlertOpen(true);
  };

  const showSuccessAlert = (msg: string) => {
    setAlertTitle('Success');
    setAlertIcon(SuccessIcon);
    setMsg(msg);
    setAlertOpen(true);
  };

  const handleAccept = () => {
    console.log('Accepting alert', isLoginSuccessRef.current);
    if (isLoginSuccessRef.current) {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <AlertBox
        onAlertOpenChange={setAlertOpen}
        IconElement={AlertIcon}
        alertOpen={alertOpen}
        title={alertTitle}
        message={msg}
        continueBtn="Ok"
        continueAction={handleAccept}
        cancelBtn={null}
        timeoutSeconds={3}
      />
      <Tabs
        defaultValue="Buyers"
        className="w-[350px]"
        onValueChange={onTabChange}
      >
        <div className="text-center py-2 text-slate-950 text-2xl font-semibold font-['Geist'] leading-normal">
          Create your account
        </div>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Buyers">Buyers</TabsTrigger>
          <TabsTrigger value="Sellers">Sellers</TabsTrigger>
        </TabsList>
        <TabsContent value="Buyers">
          <Card className="border-none shadow-none">
            <CardContent className="space-y-2 py-5 px-0">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="fname"
                  onChange={(e) => handleInputType(e)}
                  placeholder="Pedro"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="fname"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lname"
                  onChange={(e) => handleInputType(e)}
                  placeholder="Duarte"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="lname"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="email"
                  onChange={(e) => handleInputType(e)}
                  placeholder="peduarte@gmail.com"
                />
                <UserValidityIndicator
                  usernameOrEmail={email}
                  offset={{ x: -20, y: -150 }}
                  type="email"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="email"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  onChange={(e) => handleInputType(e)}
                  placeholder="@peduarte"
                />
                <UserValidityIndicator
                  usernameOrEmail={username}
                  offset={{ x: -20, y: -150 }}
                  type="username"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="username"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  onChange={(e) => handleInputType(e)}
                  placeholder="Enter your password"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="password"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="password">Repeat Password</Label>
                <Input
                  id="repeat_password"
                  type="password"
                  onChange={(e) => handleInputType(e)}
                  placeholder="Repeat your password"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="repeat-password"
                errorList={validationErrors}
              />
            </CardContent>
            <CardFooter className="px-0 flex flex-col">
              <Button
                className="w-full"
                onClick={() => {
                  handleRegister('BIDDER');
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Signing up...</span>
                  </div>
                ) : (
                  'Sign up'
                )}
              </Button>

              <Button
                variant="secondary"
                className="w-full mt-2 flex items-center justify-center"
              >
                Sign up with Google
              </Button>
              <div className="text-center text-sm mt-2">
                Already have an account?
                <a href="/login" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="Sellers">
          <Card className="border-none shadow-none">
            <CardContent className="space-y-2 py-5 px-0">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="fname"
                  onChange={(e) => handleInputType(e)}
                  placeholder="Pedro"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="fname"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lname"
                  onChange={(e) => handleInputType(e)}
                  placeholder="Duarte"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="lname"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="email"
                  onChange={(e) => handleInputType(e)}
                  placeholder="peduarte@gmail.com"
                />
                <UserValidityIndicator
                  usernameOrEmail={email}
                  offset={{ x: -20, y: -150 }}
                  type="email"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="email"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  onChange={(e) => handleInputType(e)}
                  placeholder="@globalLK"
                />
                <UserValidityIndicator
                  usernameOrEmail={username}
                  offset={{ x: -20, y: -150 }}
                  type="username"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="username"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  onChange={(e) => handleInputType(e)}
                  placeholder="Enter your password"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="password"
                errorList={validationErrors}
              />
              <div className="space-y-1">
                <Label htmlFor="password">Repeat Password</Label>
                <Input
                  id="repeat_password"
                  type="password"
                  onChange={(e) => handleInputType(e)}
                  placeholder="Repeat your password"
                />
              </div>
              <ValidateErrorElement
                eleFieldId="repeat-password"
                errorList={validationErrors}
              />
            </CardContent>
            <CardFooter className="px-0 flex flex-col">
              <Button
                className="w-full"
                onClick={() => {
                  handleRegister('SELLER');
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Signing up...</span>
                  </div>
                ) : (
                  'Sign up'
                )}
              </Button>
              <Button
                variant="secondary"
                className="w-full mt-2 flex items-center justify-center"
              >
                Sign up with Google
              </Button>
              <div className="text-center text-sm mt-2">
                Already have an account?
                <a href="/login" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
