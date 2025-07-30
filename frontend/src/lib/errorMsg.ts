export const getServerErrorMessage = (
  error: any,
  section: SectionEnum,
): string => {
  if (error.response && error.response.data && error.response.data.message) {
    return mapErrorToUserFriendlyMessage(error.response.data.message, section);
  }
  if (error.message) {
    return mapErrorToUserFriendlyMessage(error.message, section);
  }
  return mapErrorToUserFriendlyMessage(
    'An unexpected error occurred. Please try again later.',
    section,
  );
};

export enum SectionEnum {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  PROFILE = 'PROFILE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PASSWORD_UPDATE = 'PASSWORD_UPDATE',
  DEFAULT = 'DEFAULT',
  // Add other sections as needed
}

export const mapErrorToUserFriendlyMessage = (
  serverErrorMsg: string,
  errorLocation: SectionEnum,
): string => {
  if (
    errorMapper[serverErrorMsg as ErrorTypesEnum] &&
    errorMapper[serverErrorMsg as ErrorTypesEnum][errorLocation]
  ) {
    return errorMapper[serverErrorMsg as ErrorTypesEnum][errorLocation];
  }
  return (
    serverErrorMsg || 'An unexpected error occurred. Please try again later.'
  );
};

export enum ErrorTypesEnum {
  NETWORK_ERROR = 'Network Error',
  NOT_FOUND = 'Request failed with status code 404',
  INTERNAL_SERVER_ERROR = 'Request failed with status code 500',
  FORBIDDEN = 'Request failed with status code 403',
  UNAUTHORIZED = 'Request failed with status code 401',
  BAD_REQUEST = 'Request failed with status code 400',
  SERVER_ERROR = 'Internal server error',
  AUTH_FAILED = 'Authentication failed',
  USER_NOT_FOUND = 'User not found',
  ILLEGAL_ARGUMENT = 'Illegal argument',
  FILE_COUNT_EXCEEDED = 'Uploaded file count exceeds maximum limit',
  FILE_SIZE_EXCEEDED = 'Uploaded file size exceeds maximum limit',
  LIMIT_EXCEEDED = 'Limit exceeded',
  USER_INVALID = 'User is invalid. could be suspended account',
  PERMISSION_DENIED = 'Permission denied',
}

const errorMapper: Record<ErrorTypesEnum, Record<SectionEnum, string>> = {
  [ErrorTypesEnum.NETWORK_ERROR]: {
    [SectionEnum.LOGIN]:
      'Unable to connect to the server. Please check your internet connection and try logging in again.',
    [SectionEnum.REGISTER]:
      'Unable to connect to the server. Please check your internet connection and try registering again.',
    [SectionEnum.PROFILE]:
      'Unable to connect to the server. Please check your internet connection and try updating your profile again.',
    [SectionEnum.PROFILE_UPDATE]:
      'Unable to connect to the server. Please check your internet connection and try updating your profile again.',
    [SectionEnum.PASSWORD_UPDATE]:
      'Unable to connect to the server. Please check your internet connection and try updating your password again.',
    [SectionEnum.DEFAULT]:
      'Unable to connect to the server. Please check your internet connection and try again.',
  },
  [ErrorTypesEnum.NOT_FOUND]: {
    [SectionEnum.LOGIN]: 'Login service not found.',
    [SectionEnum.REGISTER]: 'Registration service not found.',
    [SectionEnum.PROFILE]: 'Profile not found.',
    [SectionEnum.PROFILE_UPDATE]: 'Profile update service not found.',
    [SectionEnum.PASSWORD_UPDATE]: 'Password update service not found.',
    [SectionEnum.DEFAULT]: 'The requested resource was not found.',
  },
  [ErrorTypesEnum.INTERNAL_SERVER_ERROR]: {
    [SectionEnum.LOGIN]: 'Login server error. Please try again later.',
    [SectionEnum.REGISTER]:
      'Registration server error. Please try again later.',
    [SectionEnum.PROFILE]: 'Profile server error. Please try again later.',
    [SectionEnum.PROFILE_UPDATE]:
      'Profile update server error. Please try again later.',
    [SectionEnum.PASSWORD_UPDATE]:
      'Password update server error. Please try again later.',
    [SectionEnum.DEFAULT]: 'Server error. Please try again later.',
  },
  [ErrorTypesEnum.FORBIDDEN]: {
    [SectionEnum.LOGIN]: 'Access denied. Please check your credentials.',
    [SectionEnum.REGISTER]: 'Registration not permitted.',
    [SectionEnum.PROFILE]: 'You do not have permission to access this profile.',
    [SectionEnum.PROFILE_UPDATE]:
      'You do not have permission to update this profile.',
    [SectionEnum.PASSWORD_UPDATE]:
      'You do not have permission to update your password.',
    [SectionEnum.DEFAULT]:
      'Access denied. You do not have permission to perform this action.',
  },
  [ErrorTypesEnum.UNAUTHORIZED]: {
    [SectionEnum.LOGIN]: 'Invalid credentials. Please try again.',
    [SectionEnum.REGISTER]: 'Registration authorization failed.',
    [SectionEnum.PROFILE]: 'You are not authorized to view this profile.',
    [SectionEnum.PROFILE_UPDATE]:
      'You are not authorized to update your profile. Please log in again.',
    [SectionEnum.PASSWORD_UPDATE]:
      'You are not authorized to update your password. Please log in again.',
    [SectionEnum.DEFAULT]: 'You are not authorized to perform this action.',
  },
  [ErrorTypesEnum.BAD_REQUEST]: {
    [SectionEnum.LOGIN]: 'Invalid login information. Please check your input.',
    [SectionEnum.REGISTER]:
      'Invalid registration information. Please check your input.',
    [SectionEnum.PROFILE]:
      'Invalid profile information. Please check your input.',
    [SectionEnum.PROFILE_UPDATE]:
      'Invalid profile information. Please check your input and try again.',
    [SectionEnum.PASSWORD_UPDATE]:
      'Invalid password information. Please check your current password and try again.',
    [SectionEnum.DEFAULT]:
      'Invalid information provided. Please check your input.',
  },
  [ErrorTypesEnum.SERVER_ERROR]: {
    [SectionEnum.LOGIN]: 'Login server error. Please try again later.',
    [SectionEnum.REGISTER]:
      'Registration server error. Please try again later.',
    [SectionEnum.PROFILE]: 'Profile server error. Please try again later.',
    [SectionEnum.PROFILE_UPDATE]:
      'Profile update server error. Please try again later.',
    [SectionEnum.PASSWORD_UPDATE]:
      'Password update server error. Please try again later.',
    [SectionEnum.DEFAULT]: 'Internal server error. Please try again later.',
  },
  [ErrorTypesEnum.AUTH_FAILED]: {
    [SectionEnum.LOGIN]:
      'Authentication failed. Please check your credentials.',
    [SectionEnum.REGISTER]: 'Authentication failed during registration.',
    [SectionEnum.PROFILE]: 'Authentication failed. Please log in again.',
    [SectionEnum.PROFILE_UPDATE]:
      'Authentication failed during profile update. Please log in again.',
    [SectionEnum.PASSWORD_UPDATE]:
      'Authentication failed during password update. Please log in again.',
    [SectionEnum.DEFAULT]: 'Authentication failed. Please log in again.',
  },
  [ErrorTypesEnum.USER_NOT_FOUND]: {
    [SectionEnum.LOGIN]: 'User not found. Please check your credentials.',
    [SectionEnum.REGISTER]: 'User registration failed.',
    [SectionEnum.PROFILE]: 'User profile not found.',
    [SectionEnum.PROFILE_UPDATE]: 'User not found. Unable to update profile.',
    [SectionEnum.PASSWORD_UPDATE]: 'User not found. Unable to update password.',
    [SectionEnum.DEFAULT]: 'User not found.',
  },
  [ErrorTypesEnum.ILLEGAL_ARGUMENT]: {
    [SectionEnum.LOGIN]:
      'Invalid input provided. Please check your login information.',
    [SectionEnum.REGISTER]:
      'Invalid input provided. Please check your registration information.',
    [SectionEnum.PROFILE]:
      'Invalid input provided. Please check your profile information.',
    [SectionEnum.PROFILE_UPDATE]:
      'Invalid profile data provided. Please check your information.',
    [SectionEnum.PASSWORD_UPDATE]:
      'Invalid password data provided. Please check your current password and new password.',
    [SectionEnum.DEFAULT]:
      'Invalid input provided. Please check your information.',
  },
  [ErrorTypesEnum.FILE_COUNT_EXCEEDED]: {
    [SectionEnum.LOGIN]: 'Too many files uploaded.',
    [SectionEnum.REGISTER]: 'Too many files uploaded during registration.',
    [SectionEnum.PROFILE]:
      'Too many files uploaded. Please reduce the number of files.',
    [SectionEnum.PROFILE_UPDATE]:
      'Too many files uploaded during profile update. Please reduce the number of files.',
    [SectionEnum.PASSWORD_UPDATE]:
      'File upload not supported for password updates.',
    [SectionEnum.DEFAULT]:
      'Too many files uploaded. Please reduce the number of files.',
  },
  [ErrorTypesEnum.FILE_SIZE_EXCEEDED]: {
    [SectionEnum.LOGIN]: 'File size too large.',
    [SectionEnum.REGISTER]: 'File size too large during registration.',
    [SectionEnum.PROFILE]: 'File size too large. Please use smaller files.',
    [SectionEnum.PROFILE_UPDATE]:
      'File size too large during profile update. Please use smaller files.',
    [SectionEnum.PASSWORD_UPDATE]:
      'File upload not supported for password updates.',
    [SectionEnum.DEFAULT]: 'File size too large. Please use smaller files.',
  },
  [ErrorTypesEnum.LIMIT_EXCEEDED]: {
    [SectionEnum.LOGIN]: 'Request limit exceeded. Please try again later.',
    [SectionEnum.REGISTER]:
      'Registration limit exceeded. Please try again later.',
    [SectionEnum.PROFILE]:
      'Profile update limit exceeded. Please try again later.',
    [SectionEnum.PROFILE_UPDATE]:
      'Profile update limit exceeded. Please try again later.',
    [SectionEnum.PASSWORD_UPDATE]:
      'Password update limit exceeded. Please try again later.',
    [SectionEnum.DEFAULT]: 'Request limit exceeded. Please try again later.',
  },
  [ErrorTypesEnum.USER_INVALID]: {
    [SectionEnum.LOGIN]:
      'Your account may be suspended. Please contact support.',
    [SectionEnum.REGISTER]: 'Registration failed. Account may be invalid.',
    [SectionEnum.PROFILE]:
      'Account is invalid or suspended. Please contact support.',
    [SectionEnum.PROFILE_UPDATE]:
      'Account is invalid or suspended. Cannot update profile. Please contact support.',
    [SectionEnum.PASSWORD_UPDATE]:
      'Account is invalid or suspended. Cannot update password. Please contact support.',
    [SectionEnum.DEFAULT]:
      'Account is invalid or suspended. Please contact support.',
  },
  [ErrorTypesEnum.PERMISSION_DENIED]: {
    [SectionEnum.LOGIN]: 'Access denied. Please check your permissions.',
    [SectionEnum.REGISTER]: 'Registration permission denied.',
    [SectionEnum.PROFILE]: 'You do not have permission to access this profile.',
    [SectionEnum.PROFILE_UPDATE]:
      'You do not have permission to update this profile.',
    [SectionEnum.PASSWORD_UPDATE]:
      'You do not have permission to update your password.',
    [SectionEnum.DEFAULT]:
      'Permission denied. You do not have permission to perform this action.',
  },
};
