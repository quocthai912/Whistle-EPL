export type PersonalIdentity = { personnelCode: string; fullName: string; username: string };
export function normalizeIdentity(input: PersonalIdentity): PersonalIdentity {
  const personnelCode = input.personnelCode.trim().toUpperCase();
  const username = input.username.trim().toLowerCase();
  const fullName = input.fullName.normalize('NFC').replace(/\s+/gu, ' ').trim();
  if (
    !/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(personnelCode) ||
    !/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username) ||
    !fullName ||
    [...fullName].length > 200
  )
    throw new Error('Invalid personal identity.');
  return { personnelCode, fullName, username };
}
export type RecoveryInput = { target: string; reason: string; reset: boolean; unlock: boolean };
export function recoveryInput(input: RecoveryInput): RecoveryInput {
  const target = input.target.trim().toLowerCase();
  const reason = input.reason.normalize('NFC').trim();
  if (
    !/^[a-z0-9][a-z0-9._-]{2,49}$/.test(target) ||
    !reason ||
    [...reason].length > 2000 ||
    (!input.reset && !input.unlock)
  )
    throw new Error('Recovery requires target, reason and reset/unlock.');
  return { ...input, target, reason };
}
export function operatorIdentity(context: {
  uid: number;
  username: string;
  sudoUid?: string;
  sudoUser?: string;
}): string {
  if (context.uid === 0) {
    if (!context.sudoUid || !/^[1-9][0-9]*$/.test(context.sudoUid) || !context.sudoUser)
      throw new Error('Use an individually authenticated sudo operator.');
    return `uid:${context.sudoUid}:${context.sudoUser} via root`;
  }
  if (!Number.isSafeInteger(context.uid) || context.uid < 1 || !context.username)
    throw new Error('Authenticated host identity required.');
  return `uid:${context.uid}:${context.username}`;
}
