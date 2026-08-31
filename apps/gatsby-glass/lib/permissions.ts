export type AccessLevel =
  | 'member'
  | 'social'
  | 'corporate_team'
  | 'admin'
  | 'super_admin';

export type UserType = 'team' | 'candidate';

const ACCESS_HIERARCHY: Record<AccessLevel, number> = {
  member: 0,
  social: 1,
  corporate_team: 2,
  admin: 3,
  super_admin: 4,
};

/** True when the user's access level is at least `required`. */
export function hasAccess(userLevel: AccessLevel, required: AccessLevel): boolean {
  return (ACCESS_HIERARCHY[userLevel] ?? 0) >= ACCESS_HIERARCHY[required];
}

/** True when the user is a corporate trial candidate (not franchise/corporate staff). */
export function isCandidate(userType: UserType | undefined | null): boolean {
  return userType === 'candidate';
}
