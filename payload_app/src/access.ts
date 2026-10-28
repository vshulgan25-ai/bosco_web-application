import type { Access, FieldAccess } from 'payload'

export const hasRole = (user: any, ...roles: string[]): boolean =>
  Boolean(user?.roles?.some((r: string) => roles.includes(r)))

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin')
export const isStaff: Access = ({ req: { user } }) => hasRole(user, 'admin', 'moderator')
export const isLoggedIn: Access = ({ req: { user } }) => Boolean(user)
export const anyone: Access = () => true

/** Персонал бачить усе, учень — лише власні записи (за вказаним полем). */
export const staffOrOwn =
  (field: string): Access =>
  ({ req: { user } }) => {
    if (!user) return false
    if (hasRole(user, 'admin', 'moderator')) return true
    return { [field]: { equals: user.id } }
  }

export const adminOnlyField: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin')
export const staffOnlyField: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin', 'moderator')
