import React, { act, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { markLastRedirect } from '../../store/slices/requiredActionsSlice';

// Action types for pending actions
export enum ActionType {
  COMPLETE_PROFILE = 'COMPLETE_PROFILE',
  SELLER_VERIFICATION_DOCUMENT_SUBMISSION = 'SELLER_VERIFICATION_DOCUMENT_SUBMISSION',
  ANNOUNCEMENT_READ = 'ANNOUNCEMENT_READ',
  FIRST_LOGIN_CHANGE_PASSWORD = 'FIRST_LOGIN_CHANGE_PASSWORD',
}

export default function ForceRedirect() {
  const pendingActions = useAppSelector((state) => state.pendingActions);
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Log the mounted state
  useEffect(() => {
    console.log('mounted');
  }, []);

  // unmount log
  useEffect(() => {
    return () => {
      console.log('unmounted');
    };
  }, []);

  // Redirect control logic
  const forceNavigate = async (path: string, msg: string) => {
    if (path !== location.pathname) {
      dispatch(markLastRedirect({ path }));

      const timeDiff = Date.now() - pendingActions.lastRedirectAt;
      const shouldShowToast =
        timeDiff > 1000 || pendingActions.lastRedirectTo !== path;

      if (shouldShowToast) {
        showRedirectInfoMessage(msg);
      }

      console.log('time diff:', timeDiff);
      console.log(`Redirecting to ${path} with message: ${msg}`);
      navigate(path);
    }
  };

  const showRedirectInfoMessage = async (
    msg: string,
    title: string = 'Action Required',
    variant: 'default' | 'destructive' = 'default',
  ) => {
    toast({
      variant: variant,
      title: title,
      description: msg,
    });
  };

  useEffect(() => {
    // Check Redirect Conditions and Perform Redirection
    console.log('Checking pending actions for redirection...');
    if (
      !pendingActions.loading &&
      authUser.token &&
      !pendingActions.ignoreRedirects
    ) {
      pendingActions.pendingActions.forEach((action) => {
        if (action.resolved) return;
        if (action.actionType === ActionType.ANNOUNCEMENT_READ) {
          console.log('Notice', action);
          forceNavigate('/notice', 'You have a new important update');
        } else if (
          action.actionType === ActionType.FIRST_LOGIN_CHANGE_PASSWORD
        ) {
          forceNavigate(
            '/settings/security',
            'change your password to continue',
          );
        } else if (action.actionType === ActionType.COMPLETE_PROFILE) {
          forceNavigate(
            '/settings/profile',
            'Complete your profile to continue',
          );
        } else if (
          action.actionType ===
          ActionType.SELLER_VERIFICATION_DOCUMENT_SUBMISSION
        ) {
          forceNavigate(
            '/settings/seller-verification-submit',
            'Submit documents to get verified as a seller',
          );
        }
      });
    }
  }, [
    authUser.token,
    authUser.isUserLoggedIn,
    pendingActions.loading,
    pendingActions.lastRedirectAt,
    pendingActions.lastRedirectTo,
    location.pathname,
    pendingActions.ignoreRedirects,
  ]);

  return <></>;
}
