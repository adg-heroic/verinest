// Prototype-only repository. Replace with persistent storage before production.
const users = new Map();
export function findUserByEmail(email) { return users.get(email.toLowerCase()) || null; }
export function createUser({ id, name, email, passwordHash, createdAt }) { const user = { id, name, email: email.toLowerCase(), passwordHash, createdAt }; users.set(user.email, user); return user; }