const USERS_KEY = "raymondUsers";
const ALLOWED_DOMAIN = "@raymond.in";

export function isRaymondEmail(email) {
  return String(email).toLowerCase().endsWith(ALLOWED_DOMAIN);
}

export function getUsers() {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

export function createAccount({ email, password, name, role }) {
  if (!isRaymondEmail(email)) {
    return {
      success: false,
      message: "Only Raymond email accounts are allowed.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters.",
    };
  }

  const users = getUsers();

  const alreadyExists = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );

  if (alreadyExists) {
    return {
      success: false,
      message: "Account already exists. Please login.",
    };
  }

  const newUser = {
    email,
    password,
    name,
    role,
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));

  return {
    success: true,
    user: newUser,
  };
}

export function loginUser(email, password) {
  const users = getUsers();

  const user = users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  return {
    success: true,
    user,
  };
}