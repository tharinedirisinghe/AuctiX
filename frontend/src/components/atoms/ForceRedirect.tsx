import React, { act, useEffect } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDispatch } from 'react-redux';

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
  const { toast } = useToast();

  // Redirect control logic
  const forceNavigate = (path: string, msg: string) => {
    if (path !== location.pathname) {
      navigate(path);
      showRedirectInfoMessage(msg);
      console.log(`Redirecting to ${path} with message: ${msg}`);
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
    // Redirect Conditions
    console.log('Checking pending actions for redirection...');
    if (!pendingActions.loading && authUser.token) {
      pendingActions.pendingActions.forEach((action) => {
        if (action.resolved) return;

        if (action.actionType === 'COMPLETE_PROFILE') {
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
        } else if (
          action.actionType === ActionType.FIRST_LOGIN_CHANGE_PASSWORD
        ) {
          forceNavigate(
            '/settings/security',
            'change your password to continue',
          );
        } else if (action.actionType === ActionType.ANNOUNCEMENT_READ) {
          console.log('Notice', action);
          forceNavigate('/notice', 'You have a new important update');
        }
      });
    }
  }, [authUser.token, pendingActions.loading, navigate]);

  return <></>;
}
