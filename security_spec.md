# Firebase Security Specification

## 1. Data Invariants
- A Profile document cannot be created with a maximum level (`maxLvl`) outside the range of 1 to 1000.
- A Profile owner ID must exactly match the authenticated user's ID (`request.auth.uid`).
- GameHistory documents must be recorded under the active user's ID, must contain valid level progress indices, and can have at most 3 lives remaining.
- Deletions are only allowed for Profile documents owned by the active user. Deletions of GameHistory records are forbidden entirely.

## 2. Dirty Dozen Payloads (Intrusive Verification Spec)
1. **Unauthenticated Profile Create**: Anonymous or non-signed-in write request to `/profiles/p1`.
2. **Spoofed Owner Profile Create**: Creating a profile where `ownerId` is set to "other_user_id".
3. **Invalid Fields Profile Create**: Inserting a ghost field `isVerifiedAdmin: true` to `/profiles/p2`.
4. **Invalid Name Profile Create**: Creating a profile with an empty name or a name exceeding 100 characters.
5. **Poisonous ID Profile Create**: Inserting an ID containing special characters `/profiles/p%$#-12` to overflow the path boundaries.
6. **Immutable Field Profile Update**: Attempting to alter `ownerId` or `createdAt` fields on update.
7. **Privilege Escalation Profile Update**: Attacking affected keys by adding arbitrary unapproved fields to update collections.
8. **Negative Level Profile Create**: Setting `maxLvl` to -5 or 0 inside a profile.
9. **Unauthenticated GameHistory Create**: Inserting an execution log to `/game_history/g1` without being authenticated.
10. **Spoofed Owner GameHistory Create**: Specifying someone else's UID in the `ownerId` property.
11. **Negative lives GameHistory Create**: Specifying 4 lives remaining or -1 lives remaining.
12. **Malicious size GameHistory Create**: Constructing a high-density clicked history array of 5,000 clicked elements to deplete resources.

All above test payloads result in `PERMISSION_DENIED` under the active `firestore.rules`.
